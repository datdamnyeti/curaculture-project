// src/components/landing/LandingView.tsx

import React from 'react';
import LandingHero from './LandingHero';
import LandingFeatures from './LandingFeatures';

interface LandingViewProps {
    onStartAssessment: () => void;
    onSignIn: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({
    onStartAssessment,
    onSignIn
}) => {
    return (
        <React.Fragment>
            <LandingHero 
                onStartAssessment={onStartAssessment}
                onSignIn={onSignIn}
            />
            <LandingFeatures />
        </React.Fragment>
    );
};

export default LandingView;