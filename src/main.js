const { Client, Intents, MessageEmbed } = require('discord.js');
const Github = require('./github');
const props = require('../data/props.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });

const messages = {};

const github = new Github();

client.once('ready', () => console.log('Bot has started.'));

client.on('messageCreate', async(message) => {

    if (message.channelId !== props.CHANNEL_ID ||
        message.type !== 'DEFAULT' ||
        message.author.bot) return;

    let author = message.author;

    try {
        message.delete();
    } catch (error) {
        console.log(error);
        author.send('We had an error deleting your message and attempting to create an issue for you. Please try again later, or message a developer if this problem persists.');
        return;
    }

    if (message.content.length < 10) {
        author.send('An issue must have at least 10 characters as the title.');
        return;
    }

    let temp = await author.send('Attempting to start issue create process... Please wait.');
    let duplicates = [];
    try {
        duplicates = await github.searchForDuplicates(message.content);
    } catch (error) {
        console.log(error);
        author.send('We had an error searching for duplicates and attempting to create an issue for you. Please try again later, or message a developer if this problem persists.');
        return;
    }
    temp.delete();
    let embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Would you like to create an issue?')
        .setURL('https://github.com/DarkanRS/world-server/issues')
        .setAuthor({ name: 'Darkan Report Bot', icon_url: 'https://i.imgur.com/XqQXQZb.png' })
        .setDescription('Hello, we have detected that you\'re trying to create a bug report. We do prefer that all issues be reported via Github. Would you like this bot to create the issue for you to discuss the problem you\'re having? Please check the below links for duplicates, and if you\'re not sure, please contact a developer.\n React with the ✅ emoji to create an issue, or the ❌ emoji to cancel.')
        .setThumbnail('https://i.imgur.com/XqQXQZb.png')
        .addFields([{
            name: 'Your Report Title',
            value: message.content,
            inline: false,
        }, {
            name: 'Issues Page',
            value: 'https://github.com/DarkanRS/world-server/issues',
            inline: false,
        }, {
            name: 'Possible Duplicates',
            value: duplicates.length === 0 ? 'No duplicates found' : duplicates.map(dup => `[${dup.title}](${dup.url})`).join('\n'),
            inline: false,
        }])
        .setTimestamp()
        .setFooter({ text: 'Darkan Report Bot', icon_url: 'https://i.imgur.com/XqQXQZb.png' });

    let reply = await author.send({ embeds: [embed] });
    reply.react('✅');
    reply.react('❌');

    if (messages[author.id]) {
        //maybe don't allow a new issue to be created until they've cancelled the old one? Send message saying please complete the previous issue first.
        messages[author.id].reply.delete();
        delete messages[author.id];
    }

    messages[author.id] = {
        message: message,
        reply: reply,
    }
});

//listen for reaction replies
client.on('messageReactionAdd', async(reaction, user) => {
    if (user.bot || !messages[user.id]) return;

    let message = messages[user.id].message;
    let reply = messages[user.id].reply;

    if (reaction.message.id !== reply.id) return;

    if (reaction.emoji.name === '✅') {
        let issue = await github.createIssue(message.content, 'This issue was created by a bot.\n\nCreated by discord user: ' + user.tag + '\n\nMessage: ' + message.content);
        try {
            user.send(`✅ Issue has been created. Please visit this link to view the issue and add any additional comments: ${issue.html_url}`);
            delete messages[user.id];
            reply.delete();
        } catch (error) {
            console.log(error);
        }
    }

    if (reaction.emoji.name === '❌') {
        message.author.send('❌ Report cancelled.');
        delete messages[user.id];
        try {
            reply.delete();
        } catch (error) {
            console.log(error);
        }
    }
});

client.login(props.TOKEN);