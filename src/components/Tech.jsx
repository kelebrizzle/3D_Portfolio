import React, { useEffect, useState } from 'react';

import { BallCanvas } from './canvas';
import { SectionWrapper } from '../hoc';
import { technologies } from '../constants';

const Tech = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handle = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', handle);
    else mq.addListener(handle);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handle);
      else mq.removeListener(handle);
    };
  }, []);

  return (
    <div className="flex flex-row flex-wrap justify-center gap-10">
      {technologies.map((technology) => (
        <div className="w-28 h-28 flex items-center justify-center" key={technology.name}>
          {!isMobile ? (
            <BallCanvas icon={technology.icon} />
          ) : (
            <img
              src={technology.icon}
              alt={technology.name}
              className="w-full h-full object-contain"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default SectionWrapper(Tech, '');
