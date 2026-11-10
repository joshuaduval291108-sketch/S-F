
// Installation : npm install
// Token dans une variable d'environnement :
//   Windows (cmd) : set DISCORD_TOKEN=ton_token
//   Linux / Mac   : export DISCORD_TOKEN=ton_token
// Lancement : node index.js
 
const fs = require("fs");
const {
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
 
const DATA_FILE = "registrations.json";
 
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}
 
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}
 
const registerCommand = new SlashCommandBuilder()
  .setName("register")
  .setDescription("Enregistrer ton équipe")
  .addStringOption((o) =>
    o.setName("team_name").setDescription("Le nom de ton équipe").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("name_tag").setDescription("Ton name tag (pseudo en jeu)").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("manager")
      .setDescription("Le manager : nom Discord ou ID Discord")
      .setRequired(true)
  );
 
client.once(Events.ClientReady, async (c) => {
  await c.application.commands.set([registerCommand.toJSON()]);
  console.log(`Connecté en tant que ${c.user.tag} (id: ${c.user.id})`);
});
 
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "register") return;
 
  const teamName = interaction.options.getString("team_name").trim();
  const nameTag = interaction.options.getString("name_tag").trim();
  const manager = interaction.options.getString("manager").trim();
 
  const data = loadData();
  const userId = interaction.user.id;
 
  // Empêche deux joueurs différents d'utiliser le même nom d'équipe
  for (const [uid, entry] of Object.entries(data)) {
    if (uid !== userId && entry.team_name.toLowerCase() === teamName.toLowerCase()) {
      return interaction.reply({
        content: `❌ Le nom d'équipe **${teamName}** est déjà pris.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
 
  // Numéro d'inscription : on garde le même si l'équipe se réinscrit
  const existing = data[userId];
  const number = existing
    ? existing.number
    : Math.max(0, ...Object.values(data).map((e) => e.number || 0)) + 1;
 
  data[userId] = {
    number: number,
    discord_name: interaction.user.tag,
    team_name: teamName,
    name_tag: nameTag,
    manager: manager,
  };
  saveData(data);
 
  await interaction.reply(
    `[${nameTag}] ${teamName} registered for STATE FORT SCRIM! (#${number})`
  );
});
 
client.login(process.env.DISCORD_TOKEN);
