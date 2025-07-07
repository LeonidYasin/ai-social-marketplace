# Test syslog server
$message = '<134>Jul 7 23:30:00 localhost test-app: Test syslog message from PowerShell'
$bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
$endpoint = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Parse('127.0.0.1'), 8000)
$udp = New-Object System.Net.Sockets.UdpClient
$udp.Send($bytes, $bytes.Length, $endpoint)
$udp.Close()
Write-Host "Syslog message sent to localhost:8000" 