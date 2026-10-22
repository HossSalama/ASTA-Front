# ASTA frontend recolor script
# Run from the frontend root (the folder that contains src\ and package.json):
#   powershell -ExecutionPolicy Bypass -File .\recolor.ps1 -DryRun    (preview only)
#   powershell -ExecutionPolicy Bypass -File .\recolor.ps1            (apply)
# Safe to run twice: new colors are never matched by the rules.

param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding $false

if (-not (Test-Path 'src')) { Write-Host 'Run this from the frontend root (src folder not found).'; exit 1 }

function Invoke-Recolor {
    param(
        [string[]]$Paths,
        [string[]]$Include,
        $Rules,
        [string]$SkipPattern
    )
    $files = Get-ChildItem -Path $Paths -Recurse -File -Include $Include -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        $orig = [IO.File]::ReadAllText($f.FullName)
        $parts = [regex]::Split($orig, '(?<=\n)')
        $changed = 0
        for ($i = 0; $i -lt $parts.Count; $i++) {
            $line = $parts[$i]
            if ($SkipPattern -and ($line -match $SkipPattern)) { continue }
            $new = $line
            foreach ($r in $Rules) {
                $new = [regex]::Replace($new, [regex]::Escape($r[0]), $r[1], 'IgnoreCase')
            }
            if ($new -ne $line) { $parts[$i] = $new; $changed++ }
        }
        if ($changed -gt 0) {
            $rel = $f.FullName.Substring((Get-Location).Path.Length + 1)
            Write-Host ("{0}: {1} line(s)" -f $rel, $changed)
            if (-not $DryRun) { [IO.File]::WriteAllText($f.FullName, ($parts -join ''), $utf8) }
        }
    }
}

# ---------------------------------------------------------------
# Part 1: theme files (light + dark palettes)
# warning colors (orange) are intentionally kept so they do not
# look like "success" (green).
# ---------------------------------------------------------------
$themeRules = @(
    @('--primary-mild: #102A71', '--primary-mild: #215D8B'),
    @("primaryMild: '#102A71'", "primaryMild: '#215D8B'"),
    @('#102A71', '#214A79'),
    @('#0D2366', '#1B3D65'),
    @('#0A1B50', '#153051'),
    @('#EBF2FF', '#EAF1F8'),
    @('#F0F5FF', '#F2F7FB'),
    @('#0D1B3E', '#12263F'),
    @('#FF6B00', '#3ABB90'),
    @('#E05E00', '#2FA37D'),
    @('#FF8533', '#5FCBA9'),
    @('#FF7F33', '#4CCBA0'),
    @('#F97316', '#3ABB90'),
    @('#FB923C', '#7DDDBD'),
    @('#3B82F6', '#3F8CC4'),
    @('#2563EB', '#2F78AE'),
    @('#1D4ED8', '#25628F'),
    @('#60A5FA', '#6FAEDC'),
    @('rgba(59, 130, 246', 'rgba(63, 140, 196')
)

Write-Host '== Part 1: theme files =='
Invoke-Recolor -Paths @('src\assets\styles\tailwind', 'src\configs', 'src\constants') `
    -Include @('*.css', '*.ts', '*.tsx') -Rules $themeRules -SkipPattern '--warning|warning'

# ---------------------------------------------------------------
# Part 2: components, views, icons, component styles
# Decorative bars/dots -> green (ASTA accent)
# Orange text/buttons/links -> mid blue (better contrast than green)
# ---------------------------------------------------------------
$uiRules = @(
    # decorative accents first (specific patterns)
    @('w-1 h-3.5 bg-[#FF6B2C]', 'w-1 h-3.5 bg-[#3ABB90]'),
    @('bg-[#FF6A00] rounded-full', 'bg-[#3ABB90] rounded-full'),
    @('rounded-full bg-[#FF6636]', 'rounded-full bg-[#3ABB90]'),
    # base palette (icons / svg / css)
    @('#102A71', '#214A79'),
    @('#0D2366', '#1B3D65'),
    @('#0A1B50', '#153051'),
    @('#EBF2FF', '#EAF1F8'),
    @('#F0F5FF', '#F2F7FB'),
    @('#FF6B00', '#3ABB90'),
    @('#E05E00', '#2FA37D'),
    @('#FF8533', '#5FCBA9'),
    # orange accents used as interactive color
    @('#FF6B2C', '#215D8B'),
    @('#e0581d', '#214A79'),
    @('#FF6636', '#215D8B'),
    @('#e05528', '#214A79'),
    @('#FF782D', '#6FAEDC'),
    @('#FFF2EA', '#EAF1F8'),
    @('#2C1A14', '#14232F'),
    @('#FF6A00', '#3ABB90'),
    # blues / navy text
    @('#0F2042', '#12263F'),
    @('#EAF2FE', '#EAF1F8'),
    @('#dfeafb', '#DCE9F4'),
    @('#e1edfe', '#DCE9F4'),
    @('#2563EB', '#215D8B'),
    @('dark:border-s-blue-500', 'dark:border-s-[#3F8CC4]'),
    @('#3B82F6', '#3F8CC4'),
    @('#60A5FA', '#6FAEDC')
)

Write-Host '== Part 2: components / views / icons / component styles =='
Invoke-Recolor -Paths @('src\components', 'src\views', 'src\assets\icons', 'src\assets\styles\components') `
    -Include @('*.tsx', '*.ts', '*.css', '*.scss', '*.svg') -Rules $uiRules

if ($DryRun) { Write-Host "`nDry run only - nothing was written." } else { Write-Host "`nDone." }

Write-Host "`nLeft untouched on purpose (check by hand):"
Write-Host '  src\components\shared\CalendarView.tsx   (#ffc6ab / #ffd993 event category tints)'
Write-Host '  src\constants\chart.constant.ts          (COLOR_3 #ff6a55 and the other chart colors)'
Write-Host '  src\assets\svg\files\*, UploadMedia.tsx  (file-type icons / illustration)'
