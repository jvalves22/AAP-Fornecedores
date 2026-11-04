export const maskedFields = new Set(['cnpj','cpf','cep','rg','telefone','celular']);

export function normalizeField(name, value) {
  const text = String(value ?? '');
  if (name === 'cnpj') return text.replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,14);
  if (name === 'rg') return text.replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,20);
  if (name === 'cpf') return text.replace(/\D/g,'').slice(0,11);
  if (name === 'cep') return text.replace(/\D/g,'').slice(0,8);
  if (name === 'telefone' || name === 'celular') {
    const digits=text.replace(/\D/g,'').slice(0,15);
    return text.trim().startsWith('+') && digits ? '+'+digits : digits;
  }
  return text;
}

function pattern(value, mask) {
  if (!value) return '';
  let result='', index=0;
  for(const char of mask) {
    if(index >= value.length) break;
    result += char === '#' ? value[index++] : char;
  }
  return result;
}

export function formatField(name, value) {
  const raw=normalizeField(name,value);
  if(name === 'cnpj') return pattern(raw,'##.###.###/####-##');
  if(name === 'cpf') return pattern(raw,'###.###.###-##');
  if(name === 'cep') return pattern(raw,'#####-###');
  // Preserva RGs legados de outros tamanhos, sem descartar caracteres.
  if(name === 'rg') return raw.length <= 9 ? pattern(raw,'##.###.###-#') : raw;
  if(name === 'telefone' || name === 'celular') {
    const digits=raw.replace(/\D/g,'');
    const local=number=>pattern(number,number.length > 10 ? '(##) #####-####' : '(##) ####-####');
    if(raw.startsWith('+') || digits.length > 11) {
      if(digits.startsWith('55') && digits.length > 11 && digits.length <= 13) return '+55 '+local(digits.slice(2));
      return '+'+digits;
    }
    return local(digits);
  }
  return raw;
}
