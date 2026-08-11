package com.fivelauncher.actionlogger.proxy;

import com.fivelauncher.actionlogger.handler.PlayerHandler;
import net.minecraftforge.common.MinecraftForge;

public class CommonProxy {

    public void registerHandlers() {
        MinecraftForge.EVENT_BUS.register(PlayerHandler.class);
    }
}