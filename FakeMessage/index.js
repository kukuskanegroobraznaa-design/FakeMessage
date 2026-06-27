import { findByProps } from "@metro/utils";
import { after } from "@patcher";
import { showToast } from "@ui/toasts";
import { registerPlugin } from "@plugins";

const MessageActions = findByProps("receiveMessage", "sendMessage");
const SelectedChannelStore = findByProps("getChannelId");
const UserStore = findByProps("getCurrentUser");

function fakeMessage(user, content) {
    const channelId = SelectedChannelStore.getChannelId();
    if (!channelId) return;

    const fakeMsg = {
        id: `${Date.now()}`,
        channel_id: channelId,
        content,
        author: {
            id: user.id,
            username: user.username,
            globalName: user.globalName ?? user.username,
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
        nonce: `${Date.now()}`,
    };

    MessageActions.receiveMessage(channelId, fakeMsg);
    showToast(`💬 Faked a message from ${user.username}!`);
}

export default registerPlugin({
    name: "FakeMessage",
    version: "1.0.0",
    description: "Long press a user to fake a message from them (visual only, only you see it)",
    authors: [{ name: "you" }],

    start() {
        const ActionSheet = findByProps("openLazy", "hideActionSheet");

        this._patch = after("openLazy", ActionSheet, (args) => {
            const [, key, props] = args;
            if (key !== "UserProfile") return;

            const user = props?.user;
            if (!user) return;

            const me = UserStore.getCurrentUser();
            if (user.id === me?.id) return;

            const newItems = [
                {
                    label: "💬 Fake Message",
                    action: () => {
                        ActionSheet.hideActionSheet();
                        const content = prompt(
                            `What should ${user.username} "say"?`,
                            "hello!"
                        );
                        if (!content) return;
                        fakeMessage(user, content);
                    },
                },
                {
                    label: "💬 Fake Message (pick text)",
                    action: () => {
                        ActionSheet.hideActionSheet();
                        const options = [
                            "lol",
                            "bro what 💀",
                            "no way",
                            "i hate you",
                            "ok fine you win",
                        ];
                        const picked = options[Math.floor(Math.random() * options.length)];
                        fakeMessage(user, picked);
                    },
                },
            ];

            props.extraButtons = [...(props.extraButtons ?? []), ...newItems];
        });
    },

    stop() {
        this._patch?.();
    },
});
