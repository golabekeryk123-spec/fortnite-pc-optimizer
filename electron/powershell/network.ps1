$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$WarningPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

# Read-only diagnostic. No arguments, arbitrary hostnames, DNS changes, route
# modifications or firewall changes are accepted from the renderer.
function Get-DefaultGateway {
    $routes = @(Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue)
    $candidates = @()
    foreach ($route in $routes) {
        $parsed = $null
        if (-not [System.Net.IPAddress]::TryParse([string]$route.NextHop, [ref]$parsed)) { continue }
        if ($parsed.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { continue }
        if ($parsed.Equals([System.Net.IPAddress]::Any) -or [System.Net.IPAddress]::IsLoopback($parsed)) { continue }
        $interface = Get-NetIPInterface -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($null -eq $interface -or $interface.ConnectionState -ne 'Connected') { continue }
        $candidates += [pscustomobject]@{
            Host = $parsed.ToString()
            Metric = [long]$route.RouteMetric + [long]$interface.InterfaceMetric
            InterfaceIndex = [long]$route.InterfaceIndex
        }
    }
    $selected = $candidates | Sort-Object Metric, InterfaceIndex | Select-Object -First 1
    if ($null -eq $selected) { return $null }
    return [string]$selected.Host
}

function Invoke-FixedProbe([string]$Address) {
    $replies = New-Object 'System.Collections.Generic.List[object]'
    $ping = New-Object System.Net.NetworkInformation.Ping
    try {
        for ($index = 0; $index -lt 6; $index++) {
            try {
                $reply = $ping.Send([System.Net.IPAddress]::Parse($Address), 1000)
                if ($reply.Status -eq [System.Net.NetworkInformation.IPStatus]::Success) {
                    $replies.Add([double]$reply.RoundtripTime)
                } else { $replies.Add($null) }
            } catch {
                # ICMP may be filtered. A failed attempt is packet loss, not a
                # successful zero-latency reply or proof that the Internet is down.
                $replies.Add($null)
            }
        }
    } finally { $ping.Dispose() }
    return [pscustomobject]@{ host = $Address; replies = @($replies.ToArray()) }
}

try {
    $gatewayHost = Get-DefaultGateway
    $gateway = if ($null -ne $gatewayHost) { Invoke-FixedProbe $gatewayHost } else { $null }
    $internet = Invoke-FixedProbe '1.1.1.1'
    $data = [pscustomobject]@{
        gateway = $gateway
        internet = $internet
        measuredAt = [DateTime]::UtcNow.ToString('o')
    }
    [Console]::WriteLine((@{ ok = $true; data = $data } | ConvertTo-Json -Depth 6 -Compress))
    exit 0
} catch {
    # A fixed message keeps environment paths and other local details out of UI.
    [Console]::WriteLine((@{ ok = $false; code = 'NETWORK_DIAGNOSTIC_FAILED'; message = 'Windows could not complete the read-only network diagnostic.' } | ConvertTo-Json -Compress))
    exit 1
}
