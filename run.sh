PATH=$PWD/bin:$PATH
PATH=$PWD/Gwion:$PATH

LIB=$PWD/lib

TIME="timeout -e err -o out -t15s"
GWION="gwion -p$LIB"

if [ "$2" = "silent" ]
then time gwion *.gw
else
  time gwion -dSndfile *.gw
  [ $(du run.sh | cut -f1) == 4 ] ||
    ffmpeg -i "gwion.wav" "gwion.mp3" &>/dev/null
fi