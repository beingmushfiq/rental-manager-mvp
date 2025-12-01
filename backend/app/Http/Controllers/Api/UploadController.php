<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240'
        ]);

        try {
            // Store the file in the public disk
            $file = $request->file('file');
            $path = $file->store('uploads', 'public');
            
            // Generate the public URL
            $url = Storage::disk('public')->url($path);

            return response()->json([
                'url' => $url,
                'path' => $path,
                'name' => $file->getClientOriginalName()
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'File upload failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
