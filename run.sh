if [ "$2" = "silent" ]
then echo "$1" | timeout 15s ./Gwion/gwion -plib -
else
  echo "$1" | timeout 15s ./Gwion/gwion -plib -dSndfile=$2 -
  ffmpeg -i "$2.wav" "$2.mp3" &>/dev/null
fi