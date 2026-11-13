// Bot Discord - commande /clear (remise à zéro du salon)
// Prérequis : Node.js 18+ et `npm install discord.js`
// Lancer avec : node bot.js
 
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
} = require('discord.js');
 
const TOKEN = process.env.DISCORD_TOKEN || 'COLLE_TON_TOKEN_ICI';
 
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 
const commands = [
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Remet le salon à zéro (supprime tous les messages)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .toJSON(),
];
 
client.once('ready', async () => {
  await client.application.commands.set(commands);
  console.log(`Connecté en tant que ${client.user.tag}`);
});
 
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'clear') return;
 
  const channel = interaction.channel;
 
  if (channel.type !== ChannelType.GuildText) {
    return interaction.reply({
      content: '❌ Cette commande fonctionne uniquement dans un salon textuel.',
      ephemeral: true,
    });
  }
 
  const botPerms = channel.permissionsFor(interaction.guild.members.me);
  if (!botPerms.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      content: '❌ Il me manque la permission « Gérer les salons ».',
      ephemeral: true,
    });
  }
 
  await interaction.reply({ content: '🧹 Remise à zéro du salon...', ephemeral: true });
 
  try {
    const reason = `Clear par ${interaction.user.tag}`;
 
    // On clone le salon (mêmes permissions, nom, sujet...) puis on supprime l'ancien.
    // Avantage : ça supprime TOUS les messages, même ceux de plus de 14 jours.
    const newChannel = await channel.clone({ reason });
    await newChannel.setPosition(channel.position);
    await channel.delete(reason);
 
    await newChannel.send(`✅ Salon remis à zéro par ${interaction.user}.`);
  } catch (err) {
    console.error(err);
  }
});
 
client.login(TOKEN);
 