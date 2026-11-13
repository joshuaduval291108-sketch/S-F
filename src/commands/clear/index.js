// Bot Discord - uniquement la commande /clear
// Prérequis : Node.js 18+ et `npm install`
// Lancer avec : npm start
 
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
} = require('discord.js');
 
const TOKEN = process.env.DISCORD_TOKEN || 'COLLE_TON_TOKEN_ICI';
 
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 
const clearCommand = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Supprime tous les messages et remet le salon à zéro')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  .toJSON();
 
client.once('ready', async () => {
  try {
    // Remplace TOUTES les commandes globales par /clear uniquement
    await client.application.commands.set([clearCommand]);
 
    // Supprime aussi les anciennes commandes enregistrées dans chaque serveur
    for (const guild of client.guilds.cache.values()) {
      await guild.commands.set([]);
    }
 
    console.log(`Connecté en tant que ${client.user.tag} - seule la commande /clear est active.`);
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement des commandes :', err);
  }
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
 
    // Clone le salon (nom, permissions, sujet...) puis supprime l'ancien :
    // tous les messages disparaissent, même ceux de plus de 14 jours.
    const newChannel = await channel.clone({ reason });
    await newChannel.setPosition(channel.position);
    await channel.delete(reason);
 
    await newChannel.send(`✅ Salon remis à zéro par ${interaction.user}.`);
  } catch (err) {
    console.error(err);
  }
});
 
client.login(TOKEN);
 
 
