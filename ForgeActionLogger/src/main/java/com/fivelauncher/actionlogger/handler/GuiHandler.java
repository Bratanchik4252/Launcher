package com.fivelauncher.actionlogger.handler;

import com.fivelauncher.actionlogger.Actions;
import com.fivelauncher.actionlogger.Logger;
import com.fivelauncher.actionlogger.Settings;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiContainer;
import net.minecraft.client.gui.ScaledResolution;
import net.minecraft.entity.player.EntityPlayer;
import net.minecraft.inventory.Slot;
import net.minecraftforge.client.event.GuiScreenEvent;
import net.minecraftforge.client.event.GuiOpenEvent;
import net.minecraftforge.fml.common.ObfuscationReflectionHelper;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;
import net.minecraftforge.fml.relauncher.Side;
import net.minecraftforge.fml.relauncher.SideOnly;
import org.lwjgl.input.Mouse;

@SideOnly(Side.CLIENT)
public class GuiHandler {

    @SubscribeEvent
    public static void onGuiOpen(GuiOpenEvent e) {
        if (!Settings.LOG_GUI_OPEN) {
            return;
        }
        Minecraft mc = Minecraft.getMinecraft();
        EntityPlayer p = mc.player;
        if (p == null) {
            return;
        }
        if (e.getGui() == null) {
            Logger.log("[" + Actions.who(p) + "] CLOSE_GUI " + Actions.pos(p));
            return;
        }
        Logger.log("[" + Actions.who(p) + "] OPEN_GUI " + e.getGui().getClass().getSimpleName()
                + " " + Actions.pos(p));
    }

    @SubscribeEvent
    public static void onMouseInput(GuiScreenEvent.MouseInputEvent.Post e) {
        if (!Settings.LOG_CLICKS) {
            return;
        }
        Minecraft mc = Minecraft.getMinecraft();
        EntityPlayer p = mc.player;
        if (p == null) {
            return;
        }
        int btn = Mouse.getEventButton();
        if (btn < 0) {
            return;
        }
        if (!Mouse.getEventButtonState()) {
            return;
        }

        ScaledResolution sr = new ScaledResolution(mc);
        int mx = Mouse.getX() * sr.getScaledWidth() / Math.max(1, mc.displayWidth);
        int my = sr.getScaledHeight() - Mouse.getY() * sr.getScaledHeight() / Math.max(1, mc.displayHeight) - 1;

        StringBuilder sb = new StringBuilder("[" + Actions.who(p) + "] CLICK ");
        sb.append(buttonName(btn));
        sb.append(" gui=").append(e.getGui().getClass().getSimpleName());
        sb.append(" x=").append(mx).append(" y=").append(my);

        if (e.getGui() instanceof GuiContainer) {
            GuiContainer gc = (GuiContainer) e.getGui();
            int[] origin = guiOrigin(gc);
            Slot s = Actions.slotAt(origin[0], origin[1], p.openContainer, mx, my);
            if (s != null) {
                sb.append(" slot#").append(s.slotNumber)
                  .append(" inv=").append(Actions.ownerName(s.inventory))
                  .append(" item=").append(Actions.itemName(s.getStack()));
            }
        }
        sb.append(" ").append(Actions.pos(p));
        Logger.log(sb.toString());
    }

    private static int[] guiOrigin(GuiContainer gc) {
        int left, top;
        try {
            left = fieldInt(gc, "guiLeft");
        } catch (Exception ex) {
            left = (gc.width - gc.xSize) / 2;
        }
        try {
            top = fieldInt(gc, "guiTop");
        } catch (Exception ex) {
            top = (gc.height - gc.ySize) / 2;
        }
        return new int[]{left, top};
    }

    @SuppressWarnings("unchecked")
    private static int fieldInt(Object owner, String name) throws Exception {
        Object value = ObfuscationReflectionHelper.getPrivateValue(owner.getClass(), owner, name);
        return ((Number) value).intValue();
    }

    private static String buttonName(int b) {
        switch (b) {
            case 0: return "LMB";
            case 1: return "RMB";
            case 2: return "MMB";
            default: return "BUTTON#" + b;
        }
    }
}