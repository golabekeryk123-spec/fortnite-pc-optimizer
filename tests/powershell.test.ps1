# Standalone, dependency-free tests. They load function definitions, not Windows side effects.
$ErrorActionPreference = 'Stop'
$enginePath = Join-Path $PSScriptRoot '..\electron\powershell\engine.ps1'
$tokens = $null; $parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile($enginePath, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
foreach ($definition in $ast.FindAll({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] }, $false)) {
    . ([scriptblock]::Create($definition.Extent.Text))
}

function Assert-Equal($Actual, $Expected, [string]$Message) {
    if ($Actual -cne $Expected) { throw ($Message + ': expected ' + $Expected + ', received ' + $Actual) }
}
$script:fixturePath = Join-Path ([IO.Path]::GetTempPath()) ('veyra-ini-test-' + [guid]::NewGuid().ToString('N') + '.ini')
function Get-FortnitePath { return $script:fixturePath }
$passed = 0
try {
    $original = "; user comment`r`n[/Script/FortniteGame.FortGameUserSettings]`r`nbUseVSync=True`r`nUnrelated=keep`r`n[ScalabilityGroups]`r`nsg.EffectsQuality=3`r`n"
    [IO.File]::WriteAllText($script:fixturePath, $original, (New-Object Text.UTF8Encoding($true)))
    $vsync = @{ Kind = 'fortnite'; Section = '/Script/FortniteGame.FortGameUserSettings'; Key = 'bUseVSync'; Value = 'False' }
    $effects = @{ Kind = 'fortnite'; Section = 'ScalabilityGroups'; Key = 'sg.EffectsQuality'; Value = '0' }
    $vsyncBefore = Get-SettingSnapshot $vsync
    Set-IniValue $vsync $null $false
    Set-IniValue $effects $null $false
    Set-IniValue $vsync $vsyncBefore $true
    $text = [IO.File]::ReadAllText($script:fixturePath)
    Assert-Equal ($text.Contains('bUseVSync=True')) $true 'Undo must restore the original key'
    Assert-Equal ($text.Contains('sg.EffectsQuality=0')) $true 'Undo must preserve other applied tweaks'
    Assert-Equal ($text.Contains('Unrelated=keep')) $true 'Unrelated settings must survive'
    Assert-Equal ($text.Contains('; user comment')) $true 'Comments must survive'
    Assert-Equal ($text.Contains("`r`n")) $true 'CRLF must survive'
    Assert-Equal ([IO.File]::ReadAllBytes($script:fixturePath)[0]) 239 'UTF-8 BOM must survive'
    $passed++; Write-Output 'PASS: independent Fortnite updates and undo preserve user content and encoding'

    $newKey = @{ Kind = 'fortnite'; Section = 'ScalabilityGroups'; Key = 'sg.ShadowQuality'; Value = '0' }
    $before = Get-SettingSnapshot $newKey
    Assert-Equal $before.exists $false 'Missing key should be captured as missing'
    Set-IniValue $newKey $null $false
    Set-IniValue $newKey $before $true
    Assert-Equal ([IO.File]::ReadAllText($script:fixturePath).Contains('sg.ShadowQuality')) $false 'Undo removes only the inserted setting'
    $passed++; Write-Output 'PASS: missing INI keys are removed when undone'

    [IO.File]::WriteAllText($script:fixturePath, "[ScalabilityGroups]`nsg.EffectsQuality=3`nsg.EffectsQuality=1`n")
    $duplicateRejected = $false
    try { $null = Get-SettingSnapshot $effects } catch { $duplicateRejected = $true }
    Assert-Equal $duplicateRejected $true 'Duplicate INI settings must fail before mutation'
    $passed++; Write-Output 'PASS: ambiguous duplicate keys are rejected'

    function Get-ActivePowerPlan { return '381b4222-f694-41f0-9685-ff5bb260df2e' }
    function Invoke-PowerCfg([string[]]$Arguments) {
        return "Minimum possible: 0x00000000`nMaximum: 0xffffffff`nIncrement: 0x00000001`nCurrent AC: 0x00000708`nCurrent DC: 0x00000384"
    }
    $power = @{ Kind = 'power'; Subgroup = '238c9fa8-0aad-41ed-83f4-97be242c8f20'; Setting = '29f6c1db-86da-48c5-9fdb-f2b67b1f44da'; Value = 0 }
    $powerBefore = Get-SettingSnapshot $power
    Assert-Equal $powerBefore.value 1800 'Capture AC value, not the min/max capability metadata'
    $passed++; Write-Output 'PASS: powercfg AC snapshot ignores hexadecimal capability metadata'

    $script:commands = New-Object 'Collections.Generic.List[string]'
    function Invoke-PowerCfg([string[]]$Arguments) { $script:commands.Add(($Arguments -join ' ')); return '' }
    Write-Setting $power @{ kind = 'power'; scheme = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'; value = 900 } $false
    Assert-Equal $script:commands[0] '/setacvalueindex 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c 238c9fa8-0aad-41ed-83f4-97be242c8f20 29f6c1db-86da-48c5-9fdb-f2b67b1f44da 0' 'Write must target the captured scheme'
    Assert-Equal $script:commands.Count 1 'An externally activated scheme must not be overwritten'
    $passed++; Write-Output 'PASS: power updates retain the exact inspected scheme'

    Write-Output ("PowerShell functional checks passed: " + $passed)
} finally {
    if (Test-Path -LiteralPath $script:fixturePath) { Remove-Item -LiteralPath $script:fixturePath -Force }
}
