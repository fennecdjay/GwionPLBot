const keep_alive = require('./keep_alive.js')
const { prefix, } = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client();
const { execSync, spawn } = require('child_process');
const token = process.env.DISCORD_BOT_SECRET;
class Bot {
  constructor(args, silent) {
    this.args = args;
    this.silent = silent;
  }
}

function is_silent(message) {
  var args = message.content.slice(prefix.length).trim();
  if(args.substring(0, 6) == 'silent') {
    args = args.substring(7, args.length).trim();
    return new Bot(args, 1);
  }
  return new Bot(args, 0);
}

function unblock(bot) {
  if(bot.args.substring(0, 3) == '```')
    bot.args = bot.args.slice(bot.args.indexOf('\n') + 1, -3).trim();
}

function run(cwd, command) {
    return execSync(command, { cwd, encoding: "utf8" });
}

function tmpfile() {
  return run('.', 'mktemp -u out.XXXXXXXX').slice(0, -1);
}

function remove_color(arg) {
  return run('.', 'echo \'' + arg + '\' | sed -r "s/\\x1B\\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" | sed "s/\\x0f//g"').slice(0, -1);
}

function send_wav(bot, channel) {
  const tmp = bot.tmp + '.mp3';
  channel.send({
    files: [{
      attachment: tmp,
      name: 'gwion.mp3'
    }]
  })
  .then(console.log)
  .catch(console.error)
  .finally( () => run('.', 'rm ' + bot.tmp + '.wav ' + tmp));
}

client.on('message', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot)
    return;
  var bot = is_silent(message);
  unblock(bot);
  if(!bot.silent)
    bot.tmp = tmpfile();
  else bot.tmp = 'silent';
  if (message.member && message.member.voice.channel) {
      bot.connection = await message.member.voice.channel.join();
  }


console.log(bot.silent);
  const gwion = spawn('bash', [ './run.sh', bot.args, bot.tmp ]);
  gwion.stdout.on('data', (data) => {
    message.channel.send(`stdout:\n\`\`\`\n${data}\`\`\`\n`);
  });

  gwion.stderr.on('data', (data) => {
    const out = remove_color(data);
    message.channel.send(`stderr: ${out}`);
  });

  gwion.on('close', (code) => {
    if(code)
      message.channel.send(`process has been timed out`);
    else if(bot.silent == 0) {
      if (message.member && message.member.voice.channel) {
        dispatcher = bot.connection.play(bot.tmp + '.mp3');
        dispatcher.on('finish', async () =>  {
          console.log('start wait')
          setTimeout(function(){ 
            console.log('leave')
            bot.connection = message.member.voice.channel.leave();
            console.log('after leave')
          }, 5000); //time in milliseconds
        });
      }
        send_wav(bot, message.channel);
    }
  });
});

client.login(token);