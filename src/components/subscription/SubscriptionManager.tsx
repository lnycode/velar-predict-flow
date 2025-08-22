import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, Zap, Crown, Check, ExternalLink, Loader2 } from 'lucide-react';

const plans = {
  free: {
    name: 'Free',
    icon: Rocket,
    price: '$0',
    features: [
      'Basic migraine tracking',
      'Simple weather correlation',
      'Limited data export',
      'Community support'
    ],
    limits: ['Up to 10 entries/month', 'Basic insights only']
  },
  premium: {
    name: 'Premium',
    icon: Zap,
    price: '$14.99',
    features: [
      'Advanced AI predictions',
      'Extended weather analysis',
      'Personalized insights',
      'Email notifications',
      'Full data export',
      'Priority support'
    ],
    popular: true
  },
  pro: {
    name: 'Pro',
    icon: Crown,
    price: '$29.99',
    features: [
      'Everything in Premium',
      'Real-time risk monitoring',
      'Advanced pattern recognition',
      'Medication optimization',
      'Telehealth integration',
      'White-glove support'
    ]
  }
};

export const SubscriptionManager: React.FC = () => {
  const { subscription, session, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (tier: string) => {
    if (!session) return;
    
    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'Failed to start checkout process',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    
    setLoading('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to open customer portal',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choose Your Velar Plan</h2>
        <p className="text-muted-foreground">
          Unlock the full power of AI-driven migraine intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([planKey, plan]) => {
          const Icon = plan.icon;
          const isCurrentPlan = subscription.tier === planKey;
          const isPopular = 'popular' in plan && plan.popular;

          return (
            <Card 
              key={planKey}
              className={`velar-card relative ${
                isCurrentPlan 
                  ? 'ring-2 ring-primary shadow-glow' 
                  : isPopular 
                    ? 'border-primary/50' 
                    : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" className="bg-success text-success-foreground">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <Icon className="w-12 h-12 mx-auto text-primary mb-2" />
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-3xl font-bold text-primary">
                  {plan.price}
                  {planKey !== 'free' && <span className="text-sm text-muted-foreground">/month</span>}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {'limits' in plan && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Limitations:</p>
                    <ul className="space-y-1">
                      {plan.limits.map((limit, index) => (
                        <li key={index} className="text-xs text-muted-foreground">
                          • {limit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4">
                  {isCurrentPlan ? (
                    planKey === 'free' ? (
                      <Button
                        onClick={() => handleUpgrade('premium')}
                        className="w-full velar-button-primary"
                        disabled={loading === 'premium'}
                      >
                        {loading === 'premium' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Upgrade to Premium'
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleManageSubscription}
                        variant="outline"
                        className="w-full"
                        disabled={loading === 'manage'}
                      >
                        {loading === 'manage' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                        )}
                        Manage Subscription
                      </Button>
                    )
                  ) : planKey === 'free' ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(planKey)}
                      className={`w-full ${
                        isPopular ? 'velar-button-primary' : ''
                      }`}
                      variant={isPopular ? 'default' : 'outline'}
                      disabled={loading === planKey}
                    >
                      {loading === planKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {subscription.active && subscription.endDate && (
        <Card className="velar-card bg-success/10 border-success/30">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-success" />
              <p className="text-success">
                Your {subscription.tier} subscription is active until{' '}
                {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};