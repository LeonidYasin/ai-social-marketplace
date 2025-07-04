# copy_tessdata.ps1
$src = "$PSScriptRoot"
$dst = "C:\Program Files\Tesseract-OCR\tessdata"

Write-Host "Копируем языковые файлы в $dst ..."

# Копируем русский
if (Test-Path "$src\\rus.traineddata") {
    Copy-Item "$src\\rus.traineddata" "$dst" -Force
    Write-Host "rus.traineddata скопирован."
} else {
    Write-Host "rus.traineddata не найден в $src"
}

# Копируем английский (если вдруг нужен)
if (Test-Path "$src\\eng.traineddata") {
    Copy-Item "$src\\eng.traineddata" "$dst" -Force
    Write-Host "eng.traineddata скопирован."
} else {
    Write-Host "eng.traineddata не найден в $src"
}

Write-Host "Готово!" 