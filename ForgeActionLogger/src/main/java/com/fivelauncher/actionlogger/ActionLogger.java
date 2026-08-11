package com.fivelauncher.actionlogger;

import com.fivelauncher.actionlogger.proxy.CommonProxy;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.SidedProxy;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent;

@Mod(modid = ActionLogger.MODID, name = ActionLogger.NAME, version = ActionLogger.VERSION, acceptedMinecraftVersions = "[1.12.2]")
public class ActionLogger {

    public static final String MODID = "actionlogger";
    public static final String NAME = "Action Logger";
    public static final String VERSION = "1.0.0";

    @Mod.Instance(MODID)
    public static ActionLogger instance;

    @SidedProxy(
            clientSide = "com.fivelauncher.actionlogger.proxy.ClientProxy",
            serverSide = "com.fivelauncher.actionlogger.proxy.CommonProxy")
    public static CommonProxy proxy;

    @Mod.EventHandler
    public void preInit(FMLPreInitializationEvent event) {
        Settings.load(event.getModConfigurationDirectory());
        Logger.start(event.getModConfigurationDirectory(), Settings.LOG_TO_FILE);
    }

    @Mod.EventHandler
    public void init(FMLInitializationEvent event) {
        proxy.registerHandlers();
    }
}