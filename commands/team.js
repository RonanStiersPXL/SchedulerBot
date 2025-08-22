const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const API_URL = process.env.API_URL || 'http://localhost:3000'

module.exports = {
    data: new SlashCommandBuilder()
        .setName('team')
        .setDescription('Manage your team')
            // create Team (with members using an @)
            .addSubcommand(sub =>
                sub.setName('create')
                    .setDescription('Create a team and add members')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('Team name')
                            .setRequired(true))
                    .addUserOption(option =>
                        option.setName('member1')
                            .setDescription('First member')
                            .setRequired(true))
                    .addUserOption(option =>
                        option.setName('member2')
                            .setDescription('Second member')
                            .setRequired(false))
                    .addUserOption(option =>
                        option.setName('member3')
                            .setDescription('Third member')
                            .setRequired(false))
                    .addUserOption(option =>
                        option.setName('member4')
                            .setDescription('Fourth member')
                            .setRequired(false))
                    .addUserOption(option =>
                        option.setName('member5')
                            .setDescription('Fifth member')
                            .setRequired(false))
            )
            // list Team (All: false, show each member in your team | ALL: true, show all teams + members)
            .addSubcommand(sub =>
                sub.setName('list')
                    .setDescription('List your team or all teams')
                    .addBooleanOption(option =>
                        option.setName('all')
                            .setDescription('Show all teams instead of just yours')
                            .setRequired(false))
            )
            // delete Team
            .addSubcommand(sub =>
                sub.setName('delete')
                    .setDescription('Delete your team (only if you are the creator)')
            )
            // add member to Team
            .addSubcommand(sub => 
                sub.setName('add')
                    .setDescription('Add members to your existing team')
                    .addUserOption(option =>
                        option.setName('member1')
                            .setDescription('Member to add')
                            .setRequired(true))
                    .addUserOption(option =>
                        option.setName('member2')
                            .setDescription('Member to add')
                            .setRequired(false))
                    .addUserOption(option =>
                        option.setName('member3')
                            .setDescription('Member to add')
                            .setRequired(false))
                    .addUserOption(option =>
                        option.setName('member4')
                            .setDescription('Member to add')
                            .setRequired(false))
                    .addUserOption(option =>
                        option.setName('member5')
                            .setDescription('Member to add')
                            .setRequired(false))
                        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            await interaction.deferReply();

            const name = interaction.options.getString('name');
            const members = [];

            for (let i = 1; i <= 5; i++) {
                const member = interaction.options.getUser(`member${i}`);
                if (member) members.push(member.id);
            }

            try {
                const res = await fetch(`${API_URL}/teams`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guildId: interaction.guild.id,
                        teamName: name,
                        members,
                        createdBy: interaction.user.id,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Failed to create team');

                await interaction.editReply(
                    `Team **${name}** created with members: ${members.map(m => `<@${m}>`).join(', ')}`
                );
            } catch (error) {
                console.error(error);
                await interaction.editReply(`Failed to create team.`);
            }
        }
        else if (sub === 'list') {
            await interaction.deferReply();
            const all = interaction.options.getBoolean('all') || false;

            try {
                if (all) {
                    // Fetch all teams in the guild
                    const res = await fetch(`${API_URL}/teams/${interaction.guild.id}`);
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || 'Failed to fetch teams');

                    if (!data.results || data.results.length === 0) {
                        return interaction.editReply("No teams found in this server.");
                    }

                    const text = data.results
                        .map(t => `**${t.teamName}**:\n${t.members.map(m => `<@${m}>`).join(', ')}`)
                        .join('\n\n');

                    await interaction.editReply(`All teams:\n\n${text}`);
                } else {
                    // Fetch just the user's team
                    const res = await fetch(`${API_URL}/teams/${interaction.guild.id}/user/${interaction.user.id}`);
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || 'Failed to fetch team');

                    if (!data.team) {
                        return interaction.editReply("You are not in a team yet.");
                    }

                    const { teamName, members } = data.team;
                    await interaction.editReply(
                        `Team **${teamName}**:\n${members.map(m => `<@${m}>`).join('\n')}`
                    );
                }
            } catch (error) {
                console.error(error);
                await interaction.editReply(`Failed to fetch team(s).`);
            }
        }
        else if (sub === 'delete') {
            await interaction.deferReply();

            try {
                const res = await fetch(`${API_URL}/teams/${interaction.guild.id}/user/${interaction.user.id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Failed to delete team');

                await interaction.editReply(`Your team has been deleted.`);
            } catch (error) {
                console.error(error);
                await interaction.editReply(`Failed to delete your team.`);
            }
        }
        else if (sub === 'add') {
            await interaction.deferReply();
            const members = [];

            for (let i = 1; i <= 5; i++) {
                const member = interaction.options.getUser(`member${i}`);
                if (member) members.push(member.id);
            }

            try {
                const res = await fetch(`${API_URL}/teams/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guildId: interaction.guild.id,
                        members,
                        userId: interaction.user.id,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Failed to add members to the team');

                await interaction.editReply(
                    `Added members: ${members.map(m => `<@${m}>`).join(', ')} to your team`
                );
            } catch (error) {
                console.error(error);
                await interaction.editReply(`Failed to add members to the team.`);
            }
        }
    }
}