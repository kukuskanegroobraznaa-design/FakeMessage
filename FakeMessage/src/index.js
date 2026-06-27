import { findByProps } from "@vendetta/metro";
import { FluxDispatcher } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { after } from "@vendetta/patcher";

const UserStore = findByProps("getCurrentUser");
const SelectedChannelStore = findByProps("getChannelId");
const ActionSheet = findByProps("openLazy", "hideActionSheet");

let unpatch: any;

export default {
    onLoad() {
        unpatch = after("openLazy", ActionSheet, (args) => {
            const [, key, props] = args;
            if (key !== "UserProfile") return;

            const user = props?.user;
            if (!user) return;

            const me = UserStore.getCurrentUser?.();
            if (!me || user.id === me.id) return;

            const extraButtons = props.extraButtons ?? [];

            extraButtons.push({
                label: "💬 Fake Message",
                action: () => {
                    ActionSheet.hideActionSheet?.();

                    const content = prompt(
                        `What should ${user.username} "say"?`,
                        "hello!"
                    );
                    if (!content) return;

                    const channelId = SelectedChannelStore.getChannelId?.();
                    if (!channelId) return;

                    FluxDispatcher.dispatch({
                        type: "MESSAGE_CREATE",
                        channelId,
                        message: {
                            id: (BigInt(Date.now() - 1420070400000) << 22n).toString(),
                            channel_id: channelId,
                            content,
                            author: {
                                id: user.id,
                                username: user.username,
                                global_name: user.globalName ?? user.username,
                                discriminator: user.discriminator,
                                avatar: user.avatar,
                                bot: false,
                            },
                            timestamp: new Date().toISOString(),
                            edited_timestamp: null,
                            tts: false,
                            mention_everyone: false,
                            mentions: [],
                            mention_roles: [],
                            attachments: [],
                            embeds: [],
                            reactions: [],
                            pinned: false,
                            type: 0,
                            flags: 0,
                            components: [],
                            nonce: (BigInt(Date.now() - 1420070400000) << 22n).toString(),
                        },
                    });

                    showToast(`💬 Faked a message from ${user.username}!`);
                },
            });

            props.extraButtons = extraButtons;
        });
    },

    onUnload() {
        unpatch?.();
    }
};
