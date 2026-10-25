param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('scan', 'inspect', 'apply', 'restore', 'restore-point', 'cleanup-preview', 'cleanup-run')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$requestText = [Console]::In.ReadToEnd()
$request = if ($requestText) { $requestText | ConvertFrom-Json } else { @{} }

# All destinations and values are defined here, never by renderer input or saved paths.
$operations = @{}
function Add-RegistryOperation([string]$Id, [string]$Path, [string]$Name, $Value, [string]$Type = 'DWord', [string]$Platform = '') {
    $operations[$Id] = @{ Kind = 'registry'; Entries = @(@{ Path = $Path; Name = $Name; Value = $Value; Type = $Type }); Platform = $Platform }
}
$cv = 'HKCU:\Software\Microsoft\Windows\CurrentVersion'
$advanced = "$cv\Explorer\Advanced"
$cdm = "$cv\ContentDeliveryManager"
Add-RegistryOperation 'game-mode' 'HKCU:\Software\Microsoft\GameBar' 'AutoGameModeEnabled' 1
$operations['game-mode'].Entries += @{ Path = 'HKCU:\Software\Microsoft\GameBar'; Name = 'AllowAutoGameMode'; Value = 1; Type = 'DWord' }
Add-RegistryOperation 'dvr-background' 'HKCU:\System\GameConfigStore' 'GameDVR_Enabled' 0
Add-RegistryOperation 'dvr-appcapture' "$cv\GameDVR" 'AppCaptureEnabled' 0
Add-RegistryOperation 'dvr-audio' "$cv\GameDVR" 'AudioCaptureEnabled' 0
Add-RegistryOperation 'dvr-cursor' "$cv\GameDVR" 'CursorCaptureEnabled' 0
Add-RegistryOperation 'gamebar-startup' 'HKCU:\Software\Microsoft\GameBar' 'ShowStartupPanel' 0
Add-RegistryOperation 'transparency' "$cv\Themes\Personalize" 'EnableTransparency' 0
Add-RegistryOperation 'window-animations' 'HKCU:\Control Panel\Desktop\WindowMetrics' 'MinAnimate' '0' 'String'
Add-RegistryOperation 'taskbar-animations' $advanced 'TaskbarAnimations' 0
Add-RegistryOperation 'menu-delay' 'HKCU:\Control Panel\Desktop' 'MenuShowDelay' '100' 'String'
Add-RegistryOperation 'explorer-shadows' $advanced 'ListviewShadow' 0
Add-RegistryOperation 'explorer-thumbnails' $advanced 'IconsOnly' 1
Add-RegistryOperation 'taskbar-widgets' $advanced 'TaskbarDa' 0 'DWord' 'windows11'
Add-RegistryOperation 'taskbar-news' "$cv\Feeds" 'ShellFeedsTaskbarViewMode' 2 'DWord' 'windows10'
Add-RegistryOperation 'taskbar-search' "$cv\Search" 'SearchboxTaskbarMode' 0
Add-RegistryOperation 'search-highlights' "$cv\SearchSettings" 'IsDynamicSearchBoxEnabled' 0
Add-RegistryOperation 'meet-now' "$cv\Policies\Explorer" 'HideSCAMeetNow' 1
Add-RegistryOperation 'mouse-acceleration' 'HKCU:\Control Panel\Mouse' 'MouseSpeed' '0' 'String'
$operations['mouse-acceleration'].Entries += @{ Path = 'HKCU:\Control Panel\Mouse'; Name = 'MouseThreshold1'; Value = '0'; Type = 'String' }
$operations['mouse-acceleration'].Entries += @{ Path = 'HKCU:\Control Panel\Mouse'; Name = 'MouseThreshold2'; Value = '0'; Type = 'String' }
Add-RegistryOperation 'mouse-trails' 'HKCU:\Control Panel\Mouse' 'MouseTrails' '0' 'String'
Add-RegistryOperation 'keyboard-delay' 'HKCU:\Control Panel\Keyboard' 'KeyboardDelay' '0' 'String'
Add-RegistryOperation 'keyboard-repeat' 'HKCU:\Control Panel\Keyboard' 'KeyboardSpeed' '31' 'String'
Add-RegistryOperation 'advertising-id' "$cv\AdvertisingInfo" 'Enabled' 0
Add-RegistryOperation 'tailored-experiences' "$cv\Privacy" 'TailoredExperiencesWithDiagnosticDataEnabled' 0
Add-RegistryOperation 'start-tracking' $advanced 'Start_TrackProgs' 0
Add-RegistryOperation 'recent-documents' $advanced 'Start_TrackDocs' 0
Add-RegistryOperation 'search-suggestions' 'HKCU:\Software\Policies\Microsoft\Windows\Explorer' 'DisableSearchBoxSuggestions' 1
Add-RegistryOperation 'text-personalization' 'HKCU:\Software\Microsoft\InputPersonalization' 'RestrictImplicitTextCollection' 1
Add-RegistryOperation 'ink-personalization' 'HKCU:\Software\Microsoft\InputPersonalization' 'RestrictImplicitInkCollection' 1
Add-RegistryOperation 'settings-notifications' "$cv\UserProfileEngagement" 'ScoobeSystemSettingEnabled' 0
Add-RegistryOperation 'background-apps' "$cv\BackgroundAccessApplications" 'GlobalUserDisabled' 1
Add-RegistryOperation 'delivery-suggestions' $cdm 'ContentDeliveryAllowed' 0
Add-RegistryOperation 'oem-apps' $cdm 'OemPreInstalledAppsEnabled' 0
Add-RegistryOperation 'suggested-apps' $cdm 'PreInstalledAppsEnabled' 0
Add-RegistryOperation 'silent-apps' $cdm 'SilentInstalledAppsEnabled' 0
Add-RegistryOperation 'windows-tips' $cdm 'SoftLandingEnabled' 0
Add-RegistryOperation 'welcome-screen' $cdm 'SubscribedContent-310093Enabled' 0
Add-RegistryOperation 'start-suggestions' $cdm 'SubscribedContent-338388Enabled' 0
Add-RegistryOperation 'settings-suggestions' $cdm 'SubscribedContent-338393Enabled' 0
Add-RegistryOperation 'lock-screen-spotlight' $cdm 'RotatingLockScreenEnabled' 0
Add-RegistryOperation 'lock-screen-tips' $cdm 'RotatingLockScreenOverlayEnabled' 0
Add-RegistryOperation 'sync-notifications' $advanced 'ShowSyncProviderNotifications' 0

$operations['power-high-performance'] = @{ Kind = 'power-plan'; Value = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c' }
$operations['power-no-sleep'] = @{ Kind = 'power'; Subgroup = '238c9fa8-0aad-41ed-83f4-97be242c8f20'; Setting = '29f6c1db-86da-48c5-9fdb-f2b67b1f44da'; Value = 0 }
$operations['power-no-monitor-off'] = @{ Kind = 'power'; Subgroup = '7516b95f-f776-4464-8c53-06167f40cc99'; Setting = '3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e'; Value = 0 }
$operations['power-usb-suspend'] = @{ Kind = 'power'; Subgroup = '2a737441-1930-4402-8d77-b2bebba308a3'; Setting = '48e6b7a6-50f5-4782-a5d4-53bb8f07e226'; Value = 0 }
$operations['power-pcie-linkstate'] = @{ Kind = 'power'; Subgroup = '501a4d13-42af-4429-9fd1-a8218c268e20'; Setting = 'ee12f906-d277-404b-b6da-e5fa1a576df5'; Value = 0 }
$operations['power-disk-timeout'] = @{ Kind = 'power'; Subgroup = '0012ee47-9041-4b5d-9b77-535fba8b1442'; Setting = '6738e2c4-e8a5-4a42-b16a-e040e769756e'; Value = 0 }

function Add-FortniteOperation([string]$Id, [string]$Key, [string]$Value, [string]$Section = '/Script/FortniteGame.FortGameUserSettings') {
    $operations[$Id] = @{ Kind = 'fortnite'; Section = $Section; Key = $Key; Value = $Value }
}
Add-FortniteOperation 'fortnite-vsync' 'bUseVSync' 'False'
Add-FortniteOperation 'fortnite-motion-blur' 'bMotionBlur' 'False'
Add-FortniteOperation 'fortnite-fps' 'bShowFPS' 'True'
Add-FortniteOperation 'fortnite-fps-limit' 'FrameRateLimit' '144.000000'
Add-FortniteOperation 'fortnite-nanite' 'bUseNanite' 'False'
Add-FortniteOperation 'fortnite-resolution' 'sg.ResolutionQuality' '100.000000' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-view-distance' 'sg.ViewDistanceQuality' '1' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-antialiasing' 'sg.AntiAliasingQuality' '0' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-shadows' 'sg.ShadowQuality' '0' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-illumination' 'sg.GlobalIlluminationQuality' '0' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-reflections' 'sg.ReflectionQuality' '0' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-postprocess' 'sg.PostProcessQuality' '0' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-textures' 'sg.TextureQuality' '2' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-effects' 'sg.EffectsQuality' '0' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-foliage' 'sg.FoliageQuality' '0' 'ScalabilityGroups'
Add-FortniteOperation 'fortnite-shading' 'sg.ShadingQuality' '0' 'ScalabilityGroups'

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    return (New-Object Security.Principal.WindowsPrincipal($identity)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
function Get-Operation([string]$Id) {
    if (-not $operations.ContainsKey($Id)) { throw 'Nieznany identyfikator modyfikacji.' }
    $operation = $operations[$Id]
    if ($operation.Platform) {
        $build = [int](Get-CimInstance Win32_OperatingSystem).BuildNumber
        if (($operation.Platform -eq 'windows11' -and $build -lt 22000) -or ($operation.Platform -eq 'windows10' -and $build -ge 22000)) {
            throw 'Ta opcja nie dotyczy zainstalowanej wersji Windows.'
        }
    }
    return $operation
}
function Invoke-PowerCfg([string[]]$Arguments) {
    $output = & "$env:SystemRoot\System32\powercfg.exe" @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw ('Windows nie udostępnia tego ustawienia zasilania: ' + ($output -join ' ')) }
    return ($output -join "`n")
}
function Get-ActivePowerPlan {
    $text = Invoke-PowerCfg @('/getactivescheme')
    $match = [regex]::Match($text, '[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}')
    if (-not $match.Success) { throw 'Nie można odczytać aktywnego planu zasilania.' }
    return $match.Value
}

function Assert-NoReparsePath([string]$Path) {
    $current = [IO.Path]::GetFullPath($Path)
    while ($current) {
        if (Test-Path -LiteralPath $current) {
            $item = Get-Item -LiteralPath $current -Force
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Ze względów bezpieczeństwa pominięto dowiązanie lub punkt ponownej analizy.' }
        }
        $parent = [IO.Directory]::GetParent($current)
        if ($null -eq $parent) { break }
        $current = $parent.FullName
    }
}
function Get-FortnitePath {
    if (Get-Process -Name 'FortniteClient-Win64-Shipping', 'FortniteClient-Win64-Shipping_EAC_EOS', 'FortniteLauncher' -ErrorAction SilentlyContinue) {
        throw 'Zamknij Fortnite przed zmianą lub cofnięciem ustawień gry.'
    }
    $iniPath = Join-Path $env:LOCALAPPDATA 'FortniteGame\Saved\Config\WindowsClient\GameUserSettings.ini'
    Assert-NoReparsePath $iniPath
    if (-not (Test-Path -LiteralPath $iniPath -PathType Leaf)) { throw 'Nie znaleziono GameUserSettings.ini. Uruchom Fortnite co najmniej raz i zamknij grę.' }
    if ((Get-Item -LiteralPath $iniPath).IsReadOnly) { throw 'GameUserSettings.ini jest tylko do odczytu. Usuń tę blokadę ręcznie przed zmianami.' }
    return $iniPath
}
function Get-IniDocument([string]$Path) {
    $bytes = [IO.File]::ReadAllBytes($Path)
    $encoding = New-Object System.Text.UTF8Encoding($false)
    $offset = 0
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
        $encoding = New-Object System.Text.UTF8Encoding($true); $offset = 3
    } elseif ($bytes.Length -ge 2 -and $bytes[0] -eq 255 -and $bytes[1] -eq 254) {
        $encoding = [Text.Encoding]::Unicode; $offset = 2
    }
    $text = $encoding.GetString($bytes, $offset, $bytes.Length - $offset)
    $newline = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }
    return @{ Lines = [Collections.Generic.List[string]]([string[]]($text -split '\r?\n')); Newline = $newline; Encoding = $encoding }
}
function Find-IniValue($Document, $Operation) {
    $inside = $false; $sectionIndex = -1; $lineIndex = -1; $count = 0
    for ($i = 0; $i -lt $Document.Lines.Count; $i++) {
        $line = $Document.Lines[$i]
        if ($line -match '^\s*\[([^\]]+)\]\s*$') {
            $inside = $Matches[1] -eq $Operation.Section
            if ($inside) { $sectionIndex = $i }
        } elseif ($inside -and $line -match ('^\s*' + [regex]::Escape($Operation.Key) + '\s*=')) {
            $lineIndex = $i; $count++
        }
    }
    if ($count -gt 1) { throw 'Plik Fortnite zawiera powielone ustawienie. Uporządkuj je w grze przed użyciem optymalizatora.' }
    return @{ SectionIndex = $sectionIndex; LineIndex = $lineIndex; Exists = ($lineIndex -ge 0); OriginalLine = $(if ($lineIndex -ge 0) { $Document.Lines[$lineIndex] } else { $null }) }
}
function Set-IniValue($Operation, $Snapshot, [bool]$Restore) {
    $iniPath = Get-FortnitePath
    $document = Get-IniDocument $iniPath
    $position = Find-IniValue $document $Operation
    if ($Restore -and -not $Snapshot.exists) {
        if ($position.Exists) { $document.Lines.RemoveAt($position.LineIndex) }
    } else {
        $newLine = if ($Restore) { [string]$Snapshot.originalLine } else { $Operation.Key + '=' + $Operation.Value }
        if ($newLine -match '[\r\n]' -or $newLine -notmatch ('^\s*' + [regex]::Escape($Operation.Key) + '\s*=')) { throw 'Nieprawidłowa kopia ustawienia Fortnite.' }
        if ($position.Exists) { $document.Lines[$position.LineIndex] = $newLine }
        elseif ($position.SectionIndex -ge 0) { $document.Lines.Insert($position.SectionIndex + 1, $newLine) }
        else {
            $document.Lines.Add('[' + $Operation.Section + ']')
            $document.Lines.Add($newLine)
        }
    }
    # Keep unrelated keys, comments, original encoding and line separator.
    $temp = $iniPath + '.veyra-' + [guid]::NewGuid().ToString('N') + '.tmp'
    try {
        [IO.File]::WriteAllText($temp, ($document.Lines -join $document.Newline), $document.Encoding)
        [IO.File]::Replace($temp, $iniPath, [NullString]::Value)
    } finally { if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force } }
}

function Get-SettingSnapshot($Operation) {
    switch ($Operation.Kind) {
        'registry' {
            $entries = @()
            foreach ($entry in $Operation.Entries) {
                $item = Get-Item -LiteralPath $entry.Path -ErrorAction SilentlyContinue
                $exists = $null -ne $item -and $item.GetValueNames() -contains $entry.Name
                $entries += @{ exists = $exists; value = $(if ($exists) { $item.GetValue($entry.Name, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames) } else { $null }); type = $(if ($exists) { $item.GetValueKind($entry.Name).ToString() } else { $null }) }
            }
            return @{ kind = 'registry'; entries = $entries }
        }
        'power-plan' { return @{ kind = 'power-plan'; scheme = (Get-ActivePowerPlan) } }
        'power' {
            $scheme = Get-ActivePowerPlan
            $text = Invoke-PowerCfg @('/query', $scheme, $Operation.Subgroup, $Operation.Setting)
            $values = [regex]::Matches($text, '0x([0-9a-fA-F]+)')
            if ($values.Count -lt 2) { throw 'Nie można odczytać bieżącej wartości AC planu zasilania.' }
            # Some settings also print hexadecimal min/max/increment values before AC/DC.
            return @{ kind = 'power'; scheme = $scheme; value = [Convert]::ToUInt32($values[$values.Count - 2].Groups[1].Value, 16) }
        }
        'fortnite' {
            $position = Find-IniValue (Get-IniDocument (Get-FortnitePath)) $Operation
            return @{ kind = 'fortnite'; exists = $position.Exists; originalLine = $position.OriginalLine }
        }
    }
}
function Write-Setting($Operation, $Snapshot, [bool]$Restore) {
    if ($Restore -and $Snapshot.kind -ne $Operation.Kind) { throw 'Kopia ustawienia nie odpowiada wybranej operacji.' }
    switch ($Operation.Kind) {
        'registry' {
            if ($Restore -and @($Snapshot.entries).Count -ne $Operation.Entries.Count) { throw 'Nieprawidłowa liczba poprzednich wartości rejestru.' }
            for ($i = 0; $i -lt $Operation.Entries.Count; $i++) {
                $entry = $Operation.Entries[$i]
                if ($Restore -and -not $Snapshot.entries[$i].exists) {
                    if (Test-Path -LiteralPath $entry.Path) { Remove-ItemProperty -LiteralPath $entry.Path -Name $entry.Name -ErrorAction SilentlyContinue }
                } else {
                    $type = if ($Restore) { [string]$Snapshot.entries[$i].type } else { $entry.Type }
                    if ($type -notin @('String', 'ExpandString', 'Binary', 'DWord', 'MultiString', 'QWord')) { throw 'Nieobsługiwany typ zapisanej wartości rejestru.' }
                    $value = if ($Restore) { $Snapshot.entries[$i].value } else { $entry.Value }
                    if (-not (Test-Path -LiteralPath $entry.Path)) { $null = New-Item -Path $entry.Path -Force }
                    $null = New-ItemProperty -LiteralPath $entry.Path -Name $entry.Name -Value $value -PropertyType $type -Force
                }
            }
        }
        'power-plan' {
            $scheme = if ($Restore) { [string]$Snapshot.scheme } else { $Operation.Value }
            if ($scheme -notmatch '^[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}$') { throw 'Nieprawidłowy identyfikator planu.' }
            $null = Invoke-PowerCfg @('/setactive', $scheme)
        }
        'power' {
            # Use the inspected plan, even if another application switches the active plan meanwhile.
            $scheme = [string]$Snapshot.scheme
            if ($scheme -notmatch '^[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}$') { throw 'Nieprawidłowy identyfikator planu.' }
            $value = if ($Restore) { [uint32]$Snapshot.value } else { [uint32]$Operation.Value }
            $null = Invoke-PowerCfg @('/setacvalueindex', $scheme, $Operation.Subgroup, $Operation.Setting, [string]$value)
            if ((Get-ActivePowerPlan) -eq $scheme) { $null = Invoke-PowerCfg @('/setactive', $scheme) }
        }
        'fortnite' { Set-IniValue $Operation $Snapshot $Restore }
    }
}

function Get-SystemScan {
    $cpus = @(Get-CimInstance Win32_Processor)
    $computer = Get-CimInstance Win32_ComputerSystem
    $modules = @(Get-CimInstance Win32_PhysicalMemory)
    $gpus = @(Get-CimInstance Win32_VideoController)
    $os = Get-CimInstance Win32_OperatingSystem
    $board = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
    $bios = Get-CimInstance Win32_BIOS
    $gpu = $gpus | Where-Object { $_.Name -match 'NVIDIA|Radeon|AMD' } | Select-Object -First 1
    if (-not $gpu) { $gpu = $gpus | Select-Object -First 1 }
    $vramGB = $null
    $gpuDriver = $gpu.DriverVersion
    $smiPath = Join-Path $env:SystemRoot 'System32\nvidia-smi.exe'
    if (-not (Test-Path -LiteralPath $smiPath)) {
        $smi = Get-Command 'nvidia-smi.exe' -ErrorAction SilentlyContinue
        if ($smi) { $smiPath = $smi.Source }
    }
    if ($gpu.Name -match 'NVIDIA' -and (Test-Path -LiteralPath $smiPath)) {
        try {
            $smiRows = @(& $smiPath '--query-gpu=name,memory.total,driver_version' '--format=csv,noheader,nounits' 2>$null | ConvertFrom-Csv -Header 'name', 'memory', 'driver')
            if ($LASTEXITCODE -eq 0 -and $smiRows.Count -gt 0) {
                $vramGB = [math]::Round([double]$smiRows[0].memory.Trim() / 1024, 2)
                $gpuDriver = $smiRows[0].driver.Trim()
            }
        } catch { $vramGB = $null }
    }
    # Win32_VideoController.AdapterRAM is a 32-bit field and is NOT an accurate VRAM source on modern GPUs.
    $speed = $modules | Where-Object { $_.ConfiguredClockSpeed -gt 0 } | Select-Object -ExpandProperty ConfiguredClockSpeed -First 1
    $totalBytes = ($modules | Measure-Object -Property Capacity -Sum).Sum
    if (-not $totalBytes) { $totalBytes = $computer.TotalPhysicalMemory }
    $disks = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType = 3' | ForEach-Object {
        @{ name = $_.DeviceID + ' ' + $_.VolumeName; totalGB = [math]::Round($_.Size / 1GB, 2); freeGB = [math]::Round($_.FreeSpace / 1GB, 2); fileSystem = $_.FileSystem }
    })
    $physicalDisks = @(Get-CimInstance Win32_DiskDrive | ForEach-Object { @{ name = $_.Model; totalGB = [math]::Round($_.Size / 1GB, 2); interface = $_.InterfaceType } })
    $network = @(Get-CimInstance Win32_NetworkAdapter | Where-Object { $_.PhysicalAdapter -and $_.NetEnabled } | ForEach-Object {
        @{ name = $_.Name; speedMbps = $(if ($_.Speed) { [math]::Round([double]$_.Speed / 1000000) } else { $null }); connection = $_.NetConnectionID }
    })
    return @{
        cpu = @{ name = (($cpus | Select-Object -ExpandProperty Name) -join ' + ').Trim(); cores = [int](($cpus | Measure-Object -Property NumberOfCores -Sum).Sum); threads = [int](($cpus | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum); maxClockMHz = $cpus[0].MaxClockSpeed }
        gpu = @{ name = $gpu.Name; vramGB = $vramGB; driver = $gpuDriver; allAdapters = @($gpus | ForEach-Object { @{ name = $_.Name; driver = $_.DriverVersion } }) }
        memory = @{ totalGB = [math]::Round($totalBytes / 1GB, 2); speedMHz = $(if ($speed) { [int]$speed } else { $null }); slotsUsed = $modules.Count; usableGB = [math]::Round($computer.TotalPhysicalMemory / 1GB, 2); modules = @($modules | ForEach-Object { @{ manufacturer = $_.Manufacturer; partNumber = ([string]$_.PartNumber).Trim(); capacityGB = [math]::Round($_.Capacity / 1GB, 2); speedMHz = $_.ConfiguredClockSpeed; slot = $_.DeviceLocator } }) }
        os = @{ name = $os.Caption; version = $os.Version; build = $os.BuildNumber; architecture = $os.OSArchitecture; lastBoot = $os.LastBootUpTime.ToUniversalTime().ToString('o') }
        board = @{ manufacturer = $board.Manufacturer; model = $board.Product; bios = $bios.SMBIOSBIOSVersion }
        disks = $disks; physicalDisks = $physicalDisks; network = $network
        isAdmin = (Test-Administrator); scannedAt = [DateTime]::UtcNow.ToString('o')
    }
}

function New-VeyraRestorePoint {
    if (-not (Test-Administrator)) { throw 'Punkt przywracania wymaga uruchomienia Veyra jako administrator.' }
    $before = @(Get-ComputerRestorePoint -ErrorAction Stop)
    $description = 'Veyra przed optymalizacją ' + [DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss')
    Checkpoint-Computer -Description $description -RestorePointType 'MODIFY_SETTINGS' -ErrorAction Stop -WarningAction Stop
    $point = Get-ComputerRestorePoint | Where-Object { $_.Description -eq $description -and $_.SequenceNumber -notin @($before | ForEach-Object { $_.SequenceNumber }) } | Sort-Object SequenceNumber -Descending | Select-Object -First 1
    if (-not $point) { throw 'Windows nie utworzył nowego punktu. Sprawdź Ochronę systemu oraz limit częstotliwości punktów przywracania (zwykle 24 godziny).' }
    return @{ id = [string]$point.SequenceNumber; createdAt = [DateTime]::UtcNow.ToString('o'); description = $description }
}

$cleanupRoots = @{
    'user-temp' = @{ Path = (Join-Path $env:LOCALAPPDATA 'Temp'); Label = 'Pliki tymczasowe użytkownika'; Description = 'Wyłącznie pliki starsze niż 7 dni. Otwarte pliki i dowiązania są pomijane.' }
    'windows-temp' = @{ Path = (Join-Path $env:SystemRoot 'Temp'); Label = 'Pliki tymczasowe Windows'; Description = 'Pliki starsze niż 7 dni w Windows\\Temp. Dostęp może wymagać administratora.' }
}
function Get-EligibleTempFiles([string]$Id) {
    if (-not $cleanupRoots.ContainsKey($Id)) { throw 'Nieznana kategoria czyszczenia.' }
    $root = [IO.Path]::GetFullPath($cleanupRoots[$Id].Path).TrimEnd('\')
    if (-not (Test-Path -LiteralPath $root -PathType Container)) { return }
    Assert-NoReparsePath $root
    $cutoff = [DateTime]::UtcNow.AddDays(-7)
    $pending = New-Object 'Collections.Generic.Stack[string]'
    $pending.Push($root)
    while ($pending.Count -gt 0) {
        $directory = $pending.Pop()
        # Enumerate one level at a time; -Recurse may follow junctions on older PowerShell versions.
        $children = @(Get-ChildItem -LiteralPath $directory -Force -ErrorAction SilentlyContinue)
        foreach ($entry in $children) {
            if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
            $full = [IO.Path]::GetFullPath($entry.FullName)
            if (-not $full.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { continue }
            if ($entry.PSIsContainer) { $pending.Push($full) }
            elseif ($entry.LastWriteTimeUtc -lt $cutoff -and $entry.CreationTimeUtc -lt $cutoff) { $entry }
        }
    }
}
function Get-CleanupPreview {
    $items = @()
    foreach ($id in @('user-temp', 'windows-temp')) {
        $bytes = [long]0; $count = 0; $notice = $null
        try { Get-EligibleTempFiles $id | ForEach-Object { $bytes += $_.Length; $count++ } }
        catch { $notice = $_.Exception.Message }
        $items += @{ id = $id; label = $cleanupRoots[$id].Label; description = $cleanupRoots[$id].Description; bytes = $bytes; files = $count; notice = $notice }
    }
    return @{ items = $items; scannedAt = [DateTime]::UtcNow.ToString('o') }
}
function Invoke-TempCleanup($Ids) {
    if (@($Ids).Count -eq 0 -or @($Ids).Count -gt 2) { throw 'Wybierz prawidłowe kategorie czyszczenia.' }
    $bytes = [long]0; $files = 0; $failed = 0
    foreach ($id in $Ids) {
        if (-not $cleanupRoots.ContainsKey([string]$id)) { throw 'Nieznana kategoria czyszczenia.' }
        Get-EligibleTempFiles ([string]$id) | ForEach-Object {
            $file = $_
            try {
                # Recheck the entire path and age directly before opening it exclusively.
                Assert-NoReparsePath $file.FullName
                $fresh = Get-Item -LiteralPath $file.FullName -Force
                if ($fresh.LastWriteTimeUtc -ge [DateTime]::UtcNow.AddDays(-7) -or $fresh.CreationTimeUtc -ge [DateTime]::UtcNow.AddDays(-7)) { return }
                $stream = New-Object IO.FileStream($file.FullName, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None, 4096, [IO.FileOptions]::DeleteOnClose)
                $length = $stream.Length
                $stream.Dispose()
                $bytes += $length; $files++
            } catch { $failed++ }
        }
    }
    # No directories, Recycle Bin, downloads, game files, shader caches or browser profiles are deleted.
    return @{ bytes = $bytes; files = $files; failedFiles = $failed }
}

try {
    $data = switch ($Action) {
        'scan' { Get-SystemScan }
        'inspect' { Get-SettingSnapshot (Get-Operation ([string]$request.id)) }
        'apply' { Write-Setting (Get-Operation ([string]$request.id)) $request.snapshot $false; @{ changed = $true } }
        'restore' { Write-Setting (Get-Operation ([string]$request.id)) $request.snapshot $true; @{ restored = $true } }
        'restore-point' { New-VeyraRestorePoint }
        'cleanup-preview' { Get-CleanupPreview }
        'cleanup-run' { Invoke-TempCleanup @($request.ids) }
    }
    @{ ok = $true; data = $data } | ConvertTo-Json -Depth 15 -Compress | Write-Output
    exit 0
} catch {
    @{ ok = $false; code = 'WINDOWS_OPERATION_FAILED'; message = $_.Exception.Message } | ConvertTo-Json -Depth 5 -Compress | Write-Output
    exit 1
}
