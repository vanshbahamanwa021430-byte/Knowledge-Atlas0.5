; 0.9.8 rename: if the old "Knowledge Atlas" app is installed, remove it quietly before installing Prvlar.
; Its data folder is kept (Prvlar copies it on first start), so nothing is lost.
!macro customInit
  StrCpy $R0 0
  ka_loop:
    EnumRegKey $R1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall" $R0
    StrCmp $R1 "" ka_done
    ReadRegStr $R2 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\$R1" "DisplayName"
    StrCmp $R2 "Knowledge Atlas" ka_found
    IntOp $R0 $R0 + 1
    Goto ka_loop
  ka_found:
    ReadRegStr $R3 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\$R1" "QuietUninstallString"
    StrCmp $R3 "" 0 +2
      ReadRegStr $R3 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\$R1" "UninstallString"
    StrCmp $R3 "" ka_done
    DetailPrint "Removing the old Knowledge Atlas app (your data is kept)"
    ExecWait '$R3 /S'
  ka_done:
!macroend
