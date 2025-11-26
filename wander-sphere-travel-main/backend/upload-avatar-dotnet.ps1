$ErrorActionPreference = 'Stop'
$token = Get-Content -Raw "./fresh_token.txt"
$uri = "http://localhost:5000/api/media/avatar"
$client = New-Object System.Net.Http.HttpClient
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $token)
$content = New-Object System.Net.Http.MultipartFormDataContent
$path = "../test-avatar.png"
$stream = [System.IO.File]::OpenRead($path)
$fileContent = New-Object System.Net.Http.StreamContent($stream)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('image/png')
$content.Add($fileContent, 'avatar', 'test-avatar.png')
Write-Host "Uploading avatar via .NET HttpClient..."
$response = $client.PostAsync($uri, $content).Result
$body = $response.Content.ReadAsStringAsync().Result
Write-Host "StatusCode:" $response.StatusCode
Write-Host "Response:" $body
$stream.Dispose()
$client.Dispose()