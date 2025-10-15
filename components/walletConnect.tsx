"use client"
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const WalletConnect = () => {

    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === 'authenticated');
                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button onClick={openConnectModal} type="button">
                                        <div className="text-gray-900 font-funnel-display items-center inline-flex bg-white border border-gray-200 hover:border-gray-400 transition-colors focus:outline-none justify-center text-center w-full lg:px-8 lg:py-2 lg:text-xl px-8 py-2">
                                            Connect Wallet
                                        </div>
                                    </button>
                                );
                            }
                            if (chain.unsupported) {
                                return (
                                    <button onClick={openChainModal} className="text-gray-900 items-center inline-flex bg-white border border-gray-200 hover:border-gray-400 transition-colors focus:outline-none justify-center text-center w-full lg:px-8 lg:py-2 lg:text-xl px-8 py-2">
                                        Wrong network
                                    </button>
                                );
                            }
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};