###-lxce-completions-###
#
# lxce completion for zsh (default completion) 
#
# Temporal:
# $: cat completions/completion.zsh >> ~/.zshrc
# $: source completions/completion.zsh
#
_lxce()
{
  local reply
  local si=$IFS
  IFS=$'\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" /usr/sbin/lxce --get-yargs-completions "\${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _lxce() lxce
###-end-lxce-completions-###

