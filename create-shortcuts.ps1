$root = 'C:\Users\32749\AppData\Roaming\reasonix\workspaces\auto\tengsheng-auto-export'
$desktop = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell
$a = $ws.CreateShortcut((Join-Path $desktop 'Tengsheng Admin.lnk'))
$a.TargetPath = (Join-Path $root '启动后台.bat')
$a.WorkingDirectory = $root
$a.IconLocation = ((Join-Path $root 'runtime
ode
ode.exe') + ',0')
$a.Description = 'Tengsheng International admin panel'
$a.Save()
$b = $ws.CreateShortcut((Join-Path $desktop 'Tengsheng Website.lnk'))
$b.TargetPath = (Join-Path $root 'site\dist\index.html')
$b.WorkingDirectory = $root
$b.Description = 'Tengsheng International website'
$b.Save()
Write-Output $desktop
