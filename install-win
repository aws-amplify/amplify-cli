@echo off
echo off
set reset=[0m
set red=[31m
set green=[32m
set yellow=[33m
set cyan=[36m
set white=[37m

echo.
echo %yellow%Installing the AWS Amplify CLI...%reset%
echo.

:: Detect unsupported architecture
for /f %%g in ('echo %PROCESSOR_ARCHITECTURE% ^| findstr 64') do (set is64Bit=%%g)
if %is64Bit% == '' (
    echo %red%Sorry, there's no Amplify CLI binary installer available for %PROCESSOR_ARCHITECTURE% architecture%reset%
    exit /b 1
)

set repo_owner=aws-amplify
set repo_name=amplify-cli

if not defined version (
    for /f delims^=^"^ tokens^=4 %%g in ('curl -sL https://api.github.com/repos/%repo_owner%/%repo_name%/releases/latest ^| findstr tag_name') do (set version=%%g)
)

set exe_name=amplify-pkg-win.exe
set tar_name=%exe_name%.tgz
set binary_url=https://github.com/%repo_owner%/%repo_name%/releases/download/%version%/%tar_name%
set binaries_dir_path=%userprofile%\.amplify\bin
set binary_base=amplify
set binary_name=%binary_base%.exe
set binary_path=%binaries_dir_path%\%binary_name%
set tar_path=%binaries_dir_path%\%tar_name%
set extraction_path=%binaries_dir_path%\%exe_name%
md %binaries_dir_path%

echo %yellow%Downloading binary...%reset%
curl -L -o %tar_path% %binary_url% || goto :error
echo %green%Download complete!%reset%

echo %yello%Extracting binary...%reset%
tar xzf %tar_path% -C %binaries_dir_path% || goto :error
move %extraction_path% %binary_path% || goto :error
del %tar_path% || goto :error
echo %green%Extraction complete!%reset%

:: Add to user path
for /F "Skip=2Tokens=1-2*" %%A In ('Reg Query HKCU\Environment /V PATH 2^>Nul') Do set "userpath=%%C"
if defined userpath (
    setx PATH "%binaries_dir_path%;%userpath%" > nul || goto :error
) else (
    setx PATH "%binaries_dir_path%" > nul || goto :error
)
:: Add to current session path as well
set "PATH=%binaries_dir_path%;%PATH%" || goto :error
echo %yellow%Added %binaries_dir_path% to user PATH%reset%

%binary_path% plugin scan
echo.
echo %green%Successfully installed the Amplify CLI.
echo.
echo Run '%binary_base% help' to get started!%reset%
echo.
goto :EOF

:error
echo.
echo %red%Error: Amplify CLI failed to install. Check your internet connection and try again.%reset%
echo If this error still occurs, install the CLI using NPM: %cyan%npm i -g @aws-amplify/cli%reset%
exit /b %errorlevel%