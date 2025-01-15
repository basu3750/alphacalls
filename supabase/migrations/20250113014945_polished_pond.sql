/*
  # Add sample coin launches

  1. Sample Data
    - Adds three sample coin launches with different platforms and potential gains
    - Includes varied launch times and descriptions
*/

INSERT INTO coin_launches (name, launch_time, potential_gain, platform, description)
VALUES
  (
    'PEPE2024',
    NOW() + interval '2 days',
    100,
    'PumpFun DEX',
    'New meme token launching with strong community backing and viral marketing campaign planned. Multiple influencer partnerships confirmed.'
  ),
  (
    'ROCKET_AI',
    NOW() + interval '5 days',
    150,
    'UniSwap',
    'AI-powered trading protocol with innovative tokenomics. Presale filled in 30 seconds. Major marketing push starting at launch.'
  ),
  (
    'MOON_LABS',
    NOW() + interval '1 day',
    120,
    'PancakeSwap',
    'DeFi laboratory project with multiple product launches planned. Strong team with previous successful projects. Whitelist spots highly contested.'
  );