const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and latency information!'),
    async execute(interaction) {
        const sent = await interaction.reply({content: 'pinging...', withResponse: true});        
        await interaction.editReply(`Pong! 🏓\nAPI Latency: ${Math.round(interaction.client.ws.ping)}ms`)
    },
};