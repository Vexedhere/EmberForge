const {EmbedBuilder}=require("discord.js");

module.exports=function attachStoreDiscordBridge(client){
  global.discordAnnounce=async(product)=>{
    try{
      const guildId=process.env.DISCORD_GUILD_ID;
      const guild=client.guilds.cache.get(guildId)||await client.guilds.fetch(guildId);
      const channel=guild.channels.cache.find(c=>c.isTextBased()&&c.name==="〔📢〕𝐀𝐍𝐍𝐎𝐔𝐍𝐂𝐄𝐌𝐄𝐍𝐓𝐒");
      if(!channel)return false;

      const embed=new EmbedBuilder()
        .setColor("#9b5cff")
        .setTitle("🛍️ New Mythical Studios Store Item!")
        .setDescription("A new item has just been added to the Mythical Studios store.")
        .addFields(
          {name:"📦 Item",value:String(product.title),inline:true},
          {name:"🗂️ Category",value:String(product.category),inline:true},
          {name:"💰 Price",value:"₹"+Number(product.price).toLocaleString("en-IN"),inline:true}
        )
        .setTimestamp()
        .setFooter({text:"Mythical Studios Store"});

      if(product.image)embed.setThumbnail(product.image);
      const storeUrl=process.env.STORE_URL||"https://store.mythicalstudios.online/";
      embed.addFields({name:"🔗 Store",value:"[View store]("+storeUrl+")"});

      await channel.send({
        content:"@everyone 🛍️ **New store item added!**",
        allowedMentions:{parse:["everyone"]},
        embeds:[embed]
      });
      return true;
    }catch(e){console.error("Store Discord announcement failed:",e);return false}
  };
  return client;
};
