export const bashCompletion = `###-begin-lxce-completions-###
#
# yargs command completion script
#
# Installation: /usr/sbin/lxce completion >> ~/.bashrc
#    or /usr/sbin/lxce completion >> ~/.bash_profile on OSX.
#
_yargs_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    # awk added to avoid conflicts with some bash completion scripts
    # (i.e: the .bashrc of Ubuntu)
    type_list=$(/usr/sbin/lxce --get-yargs-completions "\${args[@]}" | awk -F ':' '{print $1}')

    COMPREPLY=( $(compgen -W "\${type_list}" -- \${cur_word}) )

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o default -F _yargs_completions lxce
###-end-lxce-completions-###
`

export const zshCompletion = `# lxce completion script
#
# Installation: lxce completion >> ~/.zshrc
#
_lxce()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" /usr/sbin/lxce --get-yargs-completions "\${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _lxce lxce
`

