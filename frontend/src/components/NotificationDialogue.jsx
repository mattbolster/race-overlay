import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Input,
} from "@material-tailwind/react";
import { useCopyToClipboard } from "usehooks-ts";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

export function NotificationDialogue({ open, onClose }) {
  const url = `${window.location.origin}/overlay`;
  const [copied, setCopied] = useState(false);
  const [value, copy] = useCopyToClipboard();

  const handleCopy = () => {
    copy(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} handler={onClose}>
      <div className="w-full max-w-sm mx-auto px-6 py-4">
        <DialogHeader className="justify-center text-center">
          <Typography variant="h5" color="blue-gray" className="text-center font-semibold">
            Copy the link below and paste into OBS
          </Typography>
        </DialogHeader>

        <DialogBody divider className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <div className="w-[260px]">
              <input
                value={url}
                readOnly
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
              />
            </div>
            <Button
              size="md"
              onClick={handleCopy}
              onMouseLeave={() => setCopied(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 text-white" />
                  Copied
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="h-4 w-4 text-white" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </DialogBody>

        <DialogFooter className="justify-center">
          <Button variant="gradient" onClick={onClose}>
            Got it
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
