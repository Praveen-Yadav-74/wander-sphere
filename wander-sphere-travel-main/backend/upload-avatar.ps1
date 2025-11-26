$ErrorActionPreference = 'Stop'
$token = Get-Content -Raw "./fresh_token.txt"
$uri = "http://localhost:5000/api/media/avatar"
$file = Get-Item "../test-avatar.png"
$headers = @{ Authorization = "Bearer $token" }
$form = @{ avatar = $file }
Write-Host "Uploading avatar..."
$response = Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Form $form -UseBasicParsing
Write-Host "StatusCode:" $response.StatusCode
Write-Host "Content:" $response.Content