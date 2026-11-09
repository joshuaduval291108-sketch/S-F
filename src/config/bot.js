/*
  Bot Discord avec une seule commande : /register

  Installation :
    npm install

  Fichier .env (à côté de index.js) :
    DISCORD_TOKEN=ton_token_ici

  Lancement :
    node index.js
*/

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  Colors,
  Events,
  MessageFlags,
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('DISCORD_TOKEN manquant dans le fichier .env');
  process.exit(1);
}

const FICHIER = path.join(__dirname, 'registrations.json'); // sauvegarde des inscriptions

function charger() {
  try {
    return JSON.parse(fs.readFileSync(FICHIER, 'utf-8'));
  } catch {
    return {};
  }
}

function sauvegarder(data) {
  fs.writeFileSync(FICHIER, JSON.stringify(data, null, 2), 'utf-8');
}

const registerCommand = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Inscris ton équipe et ton name tag')
  .addStringOption((o) =>
    o
      .setName('team_name')
      .setDescription("Le nom de ton équipe")
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(50)
  )
  .addStringOption((o) =>
    o
      .setName('name_tag')
      .setDescription('Ton name tag (pseudo en jeu)')
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(50)
  );

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`Connecté en tant que ${c.user.tag}`);
  try {
    // .set() remplace toutes les commandes globales : les anciennes disparaissent
    await c.application.commands.set([registerCommand.toJSON()]);
    console.log('Commande /register synchronisée');
  } catch (err) {
    console.error('Erreur de synchronisation :', err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'register') return;

  try {
    const user = interaction.user;
    const teamName = interaction.options.getString('team_name', true).trim();
    const nameTag = interaction.options.getString('name_tag', true).trim();

    const data = charger();
    const dejaInscrit = Boolean(data[user.id]);

    data[user.id] = {
      team_name: teamName,
      name_tag: nameTag,
      discord_name: user.username, // nom Discord récupéré automatiquement
      discord_id: user.id,
      registered_at: new Date().toISOString(),
    };
    sauvegarder(data);

    const embed = new EmbedBuilder()
      .setTitle(dejaInscrit ? 'Inscription mise à jour ✅' : 'Inscription réussie ✅')
      .setColor(Colors.Green)
      .addFields(
        { name: 'Team name', value: teamName },
        { name: 'Name tag', value: nameTag },
        { name: 'Nom Discord', value: `${user.username} (${user})` }
      )
      .setThumbnail(user.displayAvatarURL());

    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    const msg = { content: "Une erreur est survenue, réessaie.", flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

client.login(TOKEN);
