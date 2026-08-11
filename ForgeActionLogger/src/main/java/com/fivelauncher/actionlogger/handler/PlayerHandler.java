package com.fivelauncher.actionlogger.handler;

import com.fivelauncher.actionlogger.Actions;
import com.fivelauncher.actionlogger.Logger;
import com.fivelauncher.actionlogger.Settings;
import net.minecraft.entity.item.EntityItem;
import net.minecraft.entity.player.EntityPlayer;
import net.minecraftforge.event.ServerChatEvent;
import net.minecraftforge.event.entity.item.ItemTossEvent;
import net.minecraftforge.event.entity.player.PlayerContainerEvent;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;
import net.minecraftforge.fml.common.gameevent.PlayerEvent;

public class PlayerHandler {

    @SubscribeEvent
    public static void onPlayerLoggedIn(PlayerEvent.PlayerLoggedInEvent e) {
        EntityPlayer p = e.player;
        Logger.log("[" + Actions.who(p) + "] LOGIN " + Actions.pos(p));
    }

    @SubscribeEvent
    public static void onPlayerLoggedOut(PlayerEvent.PlayerLoggedOutEvent e) {
        EntityPlayer p = e.player;
        Logger.log("[" + Actions.who(p) + "] LOGOUT " + Actions.pos(p));
    }

    @SubscribeEvent
    public static void onChangedDimension(PlayerEvent.PlayerChangedDimensionEvent e) {
        if (!Settings.LOG_DIMENSION_CHANGE) {
            return;
        }
        Logger.log("[" + Actions.who(e.player) + "] DIMENSION " + e.fromDim + " -> " + e.toDim
                + " " + Actions.pos(e.player));
    }

    @SubscribeEvent
    public static void onChat(ServerChatEvent e) {
        if (!Settings.LOG_CHAT) {
            return;
        }
        Logger.log("[" + Actions.who(e.getPlayer()) + "] CHAT \"" + e.getMessage() + "\" "
                + Actions.pos(e.getPlayer()));
    }

    @SubscribeEvent
    public static void onContainerOpen(PlayerContainerEvent.Open e) {
        if (!Settings.LOG_CONTAINER_OPEN) {
            return;
        }
        EntityPlayer p = e.getEntityPlayer();
        Logger.log("[" + Actions.who(p) + "] OPEN_CONTAINER " + Actions.containerName(e.getContainer())
                + " slots=" + e.getContainer().inventorySlots.size()
                + " " + Actions.pos(p));
    }

    @SubscribeEvent
    public static void onContainerClose(PlayerContainerEvent.Close e) {
        if (!Settings.LOG_CONTAINER_OPEN) {
            return;
        }
        EntityPlayer p = e.getEntityPlayer();
        Logger.log("[" + Actions.who(p) + "] CLOSE_CONTAINER " + Actions.containerName(e.getContainer())
                + " " + Actions.pos(p));
    }

    @SubscribeEvent
    public static void onItemPickup(PlayerEvent.ItemPickupEvent e) {
        if (!Settings.LOG_PICKUP) {
            return;
        }
        EntityPlayer p = e.player;
        EntityItem original = e.getOriginalEntity();
        String where = original != null
                ? String.format("dim=%d x=%.1f y=%.1f z=%.1f",
                        original.world.provider.getDimension(), original.posX, original.posY, original.posZ)
                : Actions.pos(p);
        Logger.log("[" + Actions.who(p) + "] PICKUP " + Actions.itemName(e.getStack())
                + " picked=from(" + where + ")");
    }

    @SubscribeEvent
    public static void onItemToss(ItemTossEvent e) {
        if (!Settings.LOG_DROP) {
            return;
        }
        EntityPlayer p = e.getPlayer();
        EntityItem item = e.getEntityItem();
        String where = item != null
                ? String.format("dim=%d x=%.1f y=%.1f z=%.1f",
                        item.world.provider.getDimension(), item.posX, item.posY, item.posZ)
                : Actions.pos(p);
        Logger.log("[" + Actions.who(p) + "] DROP " + Actions.entityItemName(item)
                + " (" + where + ")");
    }
}