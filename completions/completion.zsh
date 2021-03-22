# lxce completion script
#
# Installation: lxce completion >> ~/.zshrc
#
_lxce()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" /usr/sbin/lxce --get-yargs-completions "${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _lxce lxce

