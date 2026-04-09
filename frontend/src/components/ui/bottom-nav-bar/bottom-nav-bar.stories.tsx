import type { Meta, StoryObj } from '@storybook/react';

import { BottomNavBar } from './bottom-nav-bar';

const meta: Meta<typeof BottomNavBar> = {
  component: BottomNavBar,
  title: 'UI/BottomNavBar',
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '120px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof BottomNavBar>;

export const HomeActive: Story = {
  parameters: {
    nextjs: { navigation: { pathname: '/' } },
  },
};

export const RewardsActive: Story = {
  parameters: {
    nextjs: { navigation: { pathname: '/rewards' } },
  },
};

export const HistoryActive: Story = {
  parameters: {
    nextjs: { navigation: { pathname: '/history' } },
  },
};
