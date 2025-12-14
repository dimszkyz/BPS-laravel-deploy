<?php

namespace App\Imports;

use App\Models\Peserta;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\Hash;

class PesertaImport implements ToModel, WithHeadingRow
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        // Pastikan Excel memiliki header: nama, email, nohp, password (opsional)
        return new Peserta([
            'nama'     => $row['nama'],
            'email'    => $row['email'],
            'nohp'     => $row['nohp'],
            // Jika ada kolom password di excel, gunakan hash. Jika tidak, pakai default (misal: 123456)
            'password' => isset($row['password']) ? $row['password'] : '123456',
        ]);
    }
}