const { SlashCommandBuilder } = require("@discordjs/builders");
const { version } = require("../package.json");

module.exports = {
  data: new SlashCommandBuilder().setName("version").setDescription("Get the bot version"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      await interaction.editReply(`Schedulerbot's version: ${version}`);
    } catch (error) {
      console.error("Error responding to version command:", error);
      await interaction.editReply("Failed to fetch the bot version.");
    }
  },
};
