$ErrorActionPreference = "Stop"

function Invoke-CheckedNative {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $Executable @Arguments
    $commandExitCode = $LASTEXITCODE
    if ($commandExitCode -ne 0) {
        $argumentText = $Arguments -join " "
        throw "Command '$Executable $argumentText' failed with exit code $commandExitCode. No later validation steps were run."
    }
}

# Run from the repository root on a networked development machine.
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) { throw "Install Bun 1.4.4+ first. Run: bun upgrade, then reopen PowerShell." }
$bunVersionText = (& bun --version).Trim()
try {
    $bunVersion = [version]$bunVersionText
} catch {
    throw "Could not parse Bun version '$bunVersionText'. Install Bun 1.4.4+ and try again."
}
if ($bunVersion -lt [version]"1.4.4") {
    throw "Bun $bunVersionText does not support the nested and version-scoped overrides in package.json. Run 'bun upgrade', reopen PowerShell, and confirm 'bun --version' is 1.4.4 or newer."
}
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { throw "Install uv first." }

Push-Location (Join-Path $PSScriptRoot "../frontend")
try {
    # Force a fresh dependency resolution so newly added overrides cannot be masked by a stale lockfile.
    # The frozen install then proves the refreshed lockfile is reproducible.
    Invoke-CheckedNative -Executable "bun" -Arguments @("install", "--force")
    Invoke-CheckedNative -Executable "bun" -Arguments @("install", "--frozen-lockfile")
    Invoke-CheckedNative -Executable "bun" -Arguments @("run", "db:generate")
    Invoke-CheckedNative -Executable "bun" -Arguments @("run", "build")
} finally { Pop-Location }

Push-Location (Join-Path $PSScriptRoot "../backend")
try {
    Invoke-CheckedNative -Executable "uv" -Arguments @("lock")
    Invoke-CheckedNative -Executable "uv" -Arguments @("sync", "--all-groups")
    Invoke-CheckedNative -Executable "uv" -Arguments @("run", "python", "-m", "pytest", "-q", "--basetemp=.pytest-tmp")
} finally { Pop-Location }

Write-Host "SUCCESS: lockfiles regenerated, frontend production build passed, and backend tests passed. Review and commit frontend/bun.lock and backend/uv.lock."
