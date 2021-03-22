###-begin-lxce-completions-###
#
# yargs command completion script
#
# Installation: /usr/sbin/lxce completion >> ~/.zshrc
#    or /usr/sbin/lxce completion >> ~/.zsh_profile on OSX.
#
_lxce_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" /usr/sbin/lxce --get-yargs-completions "${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _lxce_yargs_completions lxce
###-end-lxce-completions-###

