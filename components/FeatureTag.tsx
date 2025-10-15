import { CheckCircle } from 'lucide-react';

type FeatureTagProps = {
  text: string;
  type: 'protocol' | 'ipfs' | 'blockchain';
}

export const FeatureTag = ({ text, type }: FeatureTagProps) => {
  // Define colors based on tag type
  const colors = {
    protocol: {
      icon: 'text-green-500',
      bg: 'bg-green-50',
      text: 'text-green-800'
    },
    ipfs: {
      icon: 'text-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-800'
    },
    blockchain: {
      icon: 'text-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-800'
    }
  };

  const colorSet = colors[type];

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full ${colorSet.bg} ${colorSet.text} text-sm mr-2`}>
      <CheckCircle size={14} className={`${colorSet.icon} mr-1`} /> {text}
    </div>
  );
};