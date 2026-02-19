# test-auth.ps1 (updated)
$base = "http://localhost:3000/api/auth"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "1) Registering user..."
$registerBody = @{
  firstName = "Lewis"
  lastName  = "Nyami"
  email     = "lewisnyami10+ps@test.com"
  password  = "Test1234!"
  phone     = "678920022"
} | ConvertTo-Json

try {
  $reg = Invoke-RestMethod -Uri "$base/register" -Method Post -Body $registerBody -ContentType "application/json" -WebSession $session
  Write-Host "Register response:" ($reg | ConvertTo-Json -Depth 3)
} catch {
  Write-Host "Register failed:" $_.Exception.Response.StatusCode.Value__ $_.Exception.Message
}

Write-Host "`n2) Logging in..."
$loginBody = @{
  email = "lewisnyami10+ps@test.com"
  password = "Test1234!"
} | ConvertTo-Json

try {
  $login = Invoke-RestMethod -Uri "$base/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session
  Write-Host "Login response:" ($login | ConvertTo-Json -Depth 3)
  $accessToken = $login.accessToken
  Write-Host "Access token (login): $accessToken"
} catch {
  Write-Host "Login failed:" $_.Exception.Response.StatusCode.Value__ $_.Exception.Message
  exit 1
}

Write-Host "`n3) Calling protected /me with access token (login token)..."
try {
  $me = Invoke-RestMethod -Uri "$base/me" -Method Get -Headers @{ Authorization = "Bearer $accessToken" }
  Write-Host "Me response (using login token):" ($me | ConvertTo-Json -Depth 3)
} catch {
  Write-Host "Protected call with login token failed:" $_.Exception.Response.StatusCode.Value__ $_.Exception.Message
}

Write-Host "`n4) Refreshing access token using refresh cookie..."
try {
  $refresh = Invoke-RestMethod -Uri "$base/refresh" -Method Post -WebSession $session
  Write-Host "Refresh response:" ($refresh | ConvertTo-Json -Depth 3)
  $newAccess = $refresh.accessToken
  Write-Host "Access token (refreshed): $newAccess"
  if ($newAccess) { $accessToken = $newAccess }
} catch {
  Write-Host "Refresh failed:" $_.Exception.Response.StatusCode.Value__ $_.Exception.Message
}

Write-Host "`n5) Calling protected /me with refreshed access token..."
try {
  $me2 = Invoke-RestMethod -Uri "$base/me" -Method Get -Headers @{ Authorization = "Bearer $accessToken" }
  Write-Host "Me response (using refreshed token):" ($me2 | ConvertTo-Json -Depth 3)
} catch {
  Write-Host "Protected call with refreshed token failed:" $_.Exception.Response.StatusCode.Value__ $_.Exception.Message
}

Write-Host "`n6) Logout (using refreshed token)..."
try {
  Invoke-RestMethod -Uri "$base/logout" -Method Post -Headers @{ Authorization = "Bearer $accessToken" } -WebSession $session
  Write-Host "Logged out (refresh cookie cleared)."
} catch {
  Write-Host "Logout failed:" $_.Exception.Response.StatusCode.Value__ $_.Exception.Message
}