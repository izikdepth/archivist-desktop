; NSIS installer hooks for Archivist Desktop
; Configures Windows Firewall for P2P connectivity

!macro CUSTOM_INSTALL
  ; Add Windows Firewall rules for P2P connectivity (port 8090)
  DetailPrint "Configuring Windows Firewall for P2P connectivity..."

  ; Add TCP rule
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Archivist P2P TCP" dir=in action=allow protocol=tcp localport=8090'

  ; Add UDP rule
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Archivist P2P UDP" dir=in action=allow protocol=udp localport=8090'

  DetailPrint "Firewall rules configured for Archivist P2P"
!macroend

!macro CUSTOM_UNINSTALL
  ; Remove Windows Firewall rules on uninstall
  DetailPrint "Removing Archivist firewall rules..."

  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Archivist P2P TCP"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Archivist P2P UDP"'

  DetailPrint "Firewall rules removed"
!macroend
