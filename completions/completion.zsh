#
# lxce command completion
#
# Installation (permanent): cat completions/completion.zsh >> ~/.zshrc
# Installation (one-time): source completions/completions.zsh
#
_lxce()
{
  # -----------------------------
  # Yargs default zsh completions
  # -----------------------------
  local reply
  local si=$IFS
  IFS=$'
  ' 
  reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" lxce --get-yargs-completions "${words[@]}"))
  IFS=$si
  # -----------------------------


  # -------------------------------------------------------
  # Added for lxce command (mainly for adding descriptions)
  # -------------------------------------------------------
  local -a subcmds
  
  # We return the elements as 
  # elem1 \n
  # elem2 \n
  # so we read one by line an we can create a bash list
  # with descriptions with spaces
  # TODO: change parser.py location (enable it globally)
  python3 completions/parser.py $reply | while read y 
  do 
    subcmds+=( $y )
  done
  # -----------------------------

  _describe -t subcmds 'command' subcmds
}
# Declare zsh completion for "lxce" command
compdef _lxce lxce
###-end-lxce-completions-###
