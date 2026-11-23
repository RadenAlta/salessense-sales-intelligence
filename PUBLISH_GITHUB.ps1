# Publish the sanitized SalesSense portfolio source to an EMPTY GitHub repository.
# Before running, create a PUBLIC repository (without README or .gitignore)
# named 'salessense-sales-intelligence' under account RadenAlta.
[CmdletBinding()]
param(
    [string]$RepositoryUrl = 'https://github.com/RadenAlta/salessense-sales-intelligence.git'
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is not installed. Install Git for Windows, then retry.'
}
foreach ($file in @('index.html','script.js','style.css','data/sales_data.json','README.md')) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        throw "Missing expected public project file: $file"
    }
}
foreach ($private in @('FORM_ANSWERS.md','SUBMISSION_CHECKLIST.md','screenshots/ibm_bob_review_actual.png')) {
    if (Test-Path -LiteralPath $private) {
        throw "Private submission file detected: $private. Do not publish this folder."
    }
}
if (Test-Path -LiteralPath '.git') {
    throw 'This folder is already a Git repository; inspect it before running this initial publish script.'
}
Write-Host 'Publishing sanitized SalesSense project...' -ForegroundColor Cyan
& git init -b main
if ($LASTEXITCODE -ne 0) { throw 'git init failed' }
& git add .
if ($LASTEXITCODE -ne 0) { throw 'git add failed' }
& git commit -m 'feat: publish SalesSense sales analytics capstone portfolio'
if ($LASTEXITCODE -ne 0) { throw 'git commit failed (check git user.name and user.email)' }
& git remote add origin $RepositoryUrl
if ($LASTEXITCODE -ne 0) { throw 'git remote add failed' }
Write-Host 'GitHub may open an authentication window. Never paste a password into chat.' -ForegroundColor Yellow
& git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'git push failed. Verify repo URL, repository permissions, and authentication.' }
Write-Host "Published successfully: $($RepositoryUrl -replace '\.git$','')" -ForegroundColor Green
Write-Host 'Next: GitHub repo > Settings > Pages > Deploy from branch > main > /(root).' -ForegroundColor Cyan
