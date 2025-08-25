const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const API_URL = process.env.API_URL || 'http://localhost:3000'

module.exports = {
  data: new SlashCommandBuilder()
    .setName("availability")
    .setDescription("Manage your availability")
    // add Availability (per person)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add your availability")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type of availability")
            .setRequired(true)
            .addChoices(
              { name: "Premier", value: "premier" },
              { name: "Scrim", value: "scrim" },
              { name: "Match", value: "match" }
            )
        )
        .addStringOption((option) =>
          option.setName("date").setDescription("Date (YYYY-MM-DD)").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("time").setDescription("Start time (HH:mm, 24h)").setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName("duration").setDescription("Duration in hours").setRequired(true)
        )
    )
    // remove Availability (per person, per shortId)
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove an availability")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("The short ID of your availability").setRequired(true)
        )
    )
    // list Availabilities (per person or everyone, per type)
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List availabilities")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Filter by type")
            .addChoices(
              { name: "Premier", value: "premier" },
              { name: "Scrim", value: "scrim" },
              { name: "Match", value: "match" }
            )
        )
        .addBooleanOption((option) =>
          option.setName("all").setDescription("Show all users instead of just yours")
        )
    )
    // compare Availabilities (per type)
    .addSubcommand((sub) =>
      sub
        .setName("compare")
        .setDescription("Find common availability slots")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type of availability")
            .setRequired(true)
            .addChoices(
              { name: "Premier", value: "premier" },
              { name: "Scrim", value: "scrim" },
              { name: "Match", value: "match" }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("threshold")
            .setDescription("Minimum % of users required (default 100)")
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
    sub.setName('clear')
        .setDescription('Clears your teams availabilities (only if you are the creator)')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      await interaction.deferReply();

      const type = interaction.options.getString("type");
      const date = interaction.options.getString("date");
      const time = interaction.options.getString("time");
      const duration = interaction.options.getInteger("duration");

      try {
        const startDateTime = new Date(`${date}T${time}:00Z`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

        const res = await fetch(`${API_URL}/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            type,
            startUtc: startDateTime.toISOString(),
            endUtc: endDateTime.toISOString(),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to add availability");

        await interaction.editReply(
          `Added availability [#${
            data.shortId
          }] for **${type}**: ${startDateTime.toUTCString()} → ${endDateTime.toUTCString()}`
        );
      } catch (error) {
        console.log(error);
        await interaction.editReply(`Failed to add availability.`);
      }
    } else if (sub === "remove") {
      await interaction.deferReply();
      const id = interaction.options.getInteger("id");

      try {
        const res = await fetch(
          `${API_URL}/availability/${interaction.guild.id}/${interaction.user.id}/${id}`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to remove");

        await interaction.editReply(`Removed availability [#${id}].`);
      } catch (error) {
        console.log(error);
        await interaction.editReply(`Failed to remove availability.`);
      }
    } else if (sub === "list") {
      await interaction.deferReply();
      const type = interaction.options.getString("type");
      const all = interaction.options.getBoolean("all") || false;

      try {
        let url;
        if (all) {
          url = `${API_URL}/teams/${interaction.guild.id}/user/${interaction.user.id}/availabilities`;
        } else {
          url = `${API_URL}/availability/${interaction.guild.id}/${interaction.user.id}/${interaction.type}`;
        }
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to fetch");

        const availabilities = data.results || [];

        if (availabilities.length === 0) {
          i;
          return interaction.editReply(
            all ? "No team availability found." : "You have no availability set."
          );
        }

        let filtered = all
          ? availabilities
          : availabilities.filter((a) => a.userId === interaction.user.id);
          
        if (type) {
          filtered = filtered.filter((a) => a.type === type);
        }

        const listText = filtered
          .sort((a, b) => a.startUtc.localeCompare(b.startUtc))
          .map((a) => {
            const start = new Date(a.startUtc).toUTCString();
            const end = new Date(a.endUtc).toUTCString();
            return `[#${a.shortId}] <@${a.userId}> — **${a.type}**: ${start} → ${end}`;
          })
          .join("\n");

        await interaction.editReply(`Availability:\n${listText}`);
      } catch (err) {
        console.error(err);
        await interaction.editReply("Failed to fetch availability.");
      }
    } else if (sub === "compare") {
      await interaction.deferReply();
      const type = interaction.options.getString("type");
      const threshold = interaction.options.getInteger("threshold") ?? 100;

      try {
        const res = await fetch(
          `${API_URL}/availability/${interaction.guild.id}/compare?type=${encodeURIComponent(
            type
          )}&threshold=${threshold}&userId=${interaction.user.id}`
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to fetch");

        const overlaps = data.overlaps || [];

        if (overlaps.length === 0) {
          return interaction.editReply(
            `No common availability found for **${type}** with at least ${threshold}% of users.`
          );
        }

        const listText = overlaps
          .map((o, idx) => {
            const start = new Date(o.startUtc).toUTCString();
            const end = new Date(o.endUtc).toUTCString();
            return `[#${idx + 1}] ${o.users
              .map((u) => `<@${u}>`)
              .join(", ")} — **${type}**: ${start} → ${end}`;
          })
          .join("\n");

        await interaction.editReply(`Common availability:\n${listText}`);
      } catch (error) {
        console.log(error);
        await interaction.editReply(`Failed to compare availability.`);
      }
    } else if (sub === 'clear') {
            await interaction.deferReply();
            try {
                const res = await fetch(`${API_URL}/availability/${interaction.guild.id}/clear/${interaction.user.id}`)
                const data = await res.json();
                if (!data.success) throw new Error(data.error || "Failed to clear your teams schedule");
                await interaction.editReply(`Cleared ${data.team}'s schedule.`);
            } catch (error) {
              console.log(error);
              await interaction.editReply(`Failed to clear your teams schedule`);
            }
      }
  },
};
