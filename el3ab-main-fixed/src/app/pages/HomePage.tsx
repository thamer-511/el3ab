import React from 'react';
import { Features } from '../components/Features';
import { Games } from '../components/Games';
import { Hero } from '../components/Hero';
import { Pricing } from '../components/Pricing';

export const HomePage = () => {
  return (
    <>
      <Hero />
      <Features />
      <Games />
      <Pricing />
    </>
  );
};
