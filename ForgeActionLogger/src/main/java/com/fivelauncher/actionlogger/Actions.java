package com.fivelauncher.actionlogger;

import net.minecraft.entity.item.EntityItem;
import net.minecraft.entity.player.EntityPlayer;
import net.minecraft.entity.player.InventoryPlayer;
import net.minecraft.inventory.Container;
import net.minecraft.inventory.IInventory;
import net.minecraft.inventory.Slot;
import net.minecraft.item.ItemStack;

public final class Actions {

    private Actions() {
    }

    public static String who(EntityPlayer p) {
        if (p == null) {
            return "?/?";
        }
        return p.getGameProfile().getName() + "/" + p.getUniqueID();
    }

    public static String pos(EntityPlayer p) {
        if (p == null) {
            return "";
        }
        return String.format("dim=%d x=%.1f y=%.1f z=%.1f",
                p.world.provider.getDimension(), p.posX, p.posY, p.posZ);
    }

    public static String itemName(ItemStack stack) {
        if (stack == null || stack.isEmpty()) {
            return "empty";
        }
        return stack.getDisplayName() + " x" + stack.getCount()
                + " (" + stack.getItem().getRegistryName() + ")";
    }

    public static String entityItemName(EntityItem e) {
        if (e == null || e.getEntityItem() == null || e.getEntityItem().isEmpty()) {
            return "empty";
        }
        return itemName(e.getEntityItem());
    }

    public static String containerName(Container c) {
        if (c == null) {
            return "null";
        }
        String owner = "?";
        for (Slot s : c.inventorySlots) {
            if (s != null && s.inventory != null) {
                owner = ownerName(s.inventory);
                break;
            }
        }
        return Settings.translateName(containerKey(c))
                + " [" + c.getClass().getSimpleName() + " / " + owner + "]";
    }

    private static String containerKey(Container c) {
        for (Slot s : c.inventorySlots) {
            if (s != null && s.inventory != null && s.inventory.getName() != null) {
                return s.inventory.getName();
            }
        }
        return c.getClass().getSimpleName();
    }

    public static String ownerName(IInventory inv) {
        if (inv == null) {
            return "?";
        }
        if (inv instanceof InventoryPlayer) {
            return "Инвентарь игрока";
        }
        return Settings.translateName(inv.getName());
    }

    public static Slot slotAt(int guiLeft, int guiTop, Container c, int mx, int my) {
        if (c == null || c.inventorySlots == null) {
            return null;
        }
        for (Slot s : c.inventorySlots) {
            if (s == null) {
                continue;
            }
            int x = s.xDisplayPosition + guiLeft;
            int y = s.yDisplayPosition + guiTop;
            if (mx >= x && mx < x + 16 && my >= y && my < y + 16) {
                return s;
            }
        }
        return null;
    }
}