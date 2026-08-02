# build/installer.nsh — custom NSIS include for the Viewport fork's installer.
#
# WHY: electron-builder 26.x's default running-app check scans for ANY process
# whose executable path starts with $INSTDIR
#   (Get-CimInstance Win32_Process | ? { $_.Path.StartsWith('$INSTDIR') })
# and, if it finds one, pops "the app is running, please close it" before an
# install/upgrade/uninstall. This app has a system-tray icon, so its window can
# be hidden while the process keeps running — and the path-prefix scan can also
# match unrelated processes under the install folder. The result is the reported
# bug: the uninstaller insists the app is running when the user believes it is not.
#
# Defining customCheckAppRunning REPLACES that default check. We instead match the
# EXACT executable name and force-close it (including Electron child processes via
# /T). taskkill is a no-op when the app is not running, so there is never a false
# "please close the app" prompt — the installer/uninstaller just proceeds.
#
# Note: $pid is NOT available here (electron-builder only declares it for the
# default check), so we do not filter by PID — the installer/uninstaller run as
# their own executables, never as "${APP_EXECUTABLE_FILENAME}", so there is no
# risk of the check killing itself.

!macro customCheckAppRunning
  DetailPrint "Closing ${PRODUCT_NAME} if it is running..."
  nsExec::Exec `taskkill /IM "${APP_EXECUTABLE_FILENAME}" /F /T`
  Pop $0
  # Give Windows a moment to release file handles so files are not "in use".
  Sleep 500
!macroend
