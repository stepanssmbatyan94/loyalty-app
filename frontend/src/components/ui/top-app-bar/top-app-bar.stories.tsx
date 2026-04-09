import type { Meta, StoryObj } from '@storybook/react';

import { TopAppBar } from './top-app-bar';

const meta: Meta<typeof TopAppBar> = {
  component: TopAppBar,
  title: 'UI/TopAppBar',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '80px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TopAppBar>;

export const Home: Story = {
  args: {
    variant: 'home',
    avatarUrl: null,
  },
};

export const HomeWithAvatar: Story = {
  args: {
    variant: 'home',
    avatarUrl: 'https://i.pravatar.cc/40',
  },
};

export const Catalog: Story = {
  args: {
    variant: 'catalog',
    avatarUrl: null,
  },
};

export const Redemption: Story = {
  args: {
    variant: 'redemption',
    avatarUrl: null,
  },
};
