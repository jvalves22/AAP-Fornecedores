import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatField,normalizeField } from '../src/masks.js';
test('documentos e CEP formatados preservam seus valores',()=>{
  for(const [name,raw,formatted] of [
    ['cnpj','12345678000190','12.345.678/0001-90'],['cnpj','12ABC34501DE35','12.ABC.345/01DE-35'],
    ['cpf','52998224725','529.982.247-25'],['cep','01001000','01001-000'],['rg','12345678X','12.345.678-X'],
    ['telefone','1134567890','(11) 3456-7890'],['celular','11987654321','(11) 98765-4321'],
  ]){assert.equal(formatField(name,raw),formatted);assert.equal(normalizeField(name,formatted),raw);assert.equal(formatField(name,''),'');}
});
test('RG legado e telefone internacional não perdem dados',()=>{
  assert.equal(normalizeField('rg',formatField('rg','MG1234567890')),'MG1234567890');
  assert.equal(normalizeField('celular',formatField('celular','+5511987654321')),'+5511987654321');
  assert.equal(normalizeField('telefone',formatField('telefone','+14155552671')),'+14155552671');
});
